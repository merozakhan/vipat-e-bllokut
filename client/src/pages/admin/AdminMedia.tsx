import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Upload, Trash2, Copy, Check, Image as ImageIcon, Film, Search, X, CloudUpload } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "./AdminLayout";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("sq-AL", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminMedia() {
  const utils = trpc.useUtils();
  const { data: media, isLoading } = trpc.admin.mediaList.useQuery({ limit: 200 });
  const uploadMutation = trpc.admin.mediaUpload.useMutation({
    onSuccess: () => { utils.admin.mediaList.invalidate(); toast.success("U ngarkua!"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.admin.mediaDelete.useMutation({
    onSuccess: () => { utils.admin.mediaList.invalidate(); toast.success("U fshi"); },
    onError: (e) => toast.error(e.message),
  });

  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<{ publicId: string; type: string } | null>(null);
  const [preview, setPreview] = useState<{ url: string; type: string } | null>(null);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} është shumë i madh (max 50MB)`);
        continue;
      }

      const isVideo = file.type.startsWith("video/");
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });
        const filename = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "-") + "-" + Date.now();
        await uploadMutation.mutateAsync({ base64, filename, type: isVideo ? "video" : "image" });
      } catch (err: any) {
        toast.error(`Dështoi: ${file.name}`);
      }
    }
    setUploading(false);
    e.target.value = "";
  }, [uploadMutation]);

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("URL u kopjua!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = media?.files?.filter(f => {
    if (filter !== "all" && f.type !== filter) return false;
    if (search && !f.publicId.toLowerCase().includes(search.toLowerCase()) && !f.format.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }) || [];

  const imageCount = media?.files?.filter(f => f.type === "image").length || 0;
  const videoCount = media?.files?.filter(f => f.type === "video").length || 0;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-foreground">Libraria e Mediave</h1>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">
            {media?.totalCount || 0} skedarë &middot; {imageCount} foto &middot; {videoCount} video
          </p>
        </div>
        <label className="flex items-center gap-2 px-4 py-2 bg-gold text-navy-dark font-bold text-xs md:text-sm rounded-lg hover:bg-gold-light transition-colors cursor-pointer font-sans">
          {uploading ? (
            <div className="animate-spin w-4 h-4 border-2 border-navy-dark border-t-transparent rounded-full" />
          ) : (
            <CloudUpload className="w-4 h-4" />
          )}
          {uploading ? "Duke ngarkuar..." : "Ngarko Skedarë"}
          <input type="file" accept="image/*,video/*" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Kërko skedarë..."
            className="w-full pl-9 pr-4 py-2 bg-card border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 font-sans"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "image", "video"] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg font-sans transition-colors ${
                filter === t ? "bg-gold/15 text-gold" : "text-muted-foreground hover:text-foreground hover:bg-card"
              }`}
            >
              {t === "all" ? "Të Gjitha" : t === "image" ? "Foto" : "Video"}
            </button>
          ))}
        </div>
      </div>

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-foreground mb-2">Fshi Skedarin?</h3>
            <p className="text-sm text-muted-foreground mb-4 font-sans">Ky veprim do ta fshijë përgjithmonë nga cloud.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 border border-border rounded-lg text-sm font-sans text-muted-foreground hover:text-foreground">Anulo</button>
              <button
                onClick={() => { deleteMutation.mutate({ publicId: deleteId.publicId, type: deleteId.type as any }); setDeleteId(null); }}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-sans font-semibold hover:bg-red-600"
              >Fshi</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPreview(null)}>
          <div className="relative max-w-4xl w-full max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreview(null)} className="absolute -top-10 right-0 text-white/60 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            {preview.type === "video" ? (
              <video src={preview.url} controls className="w-full max-h-[80vh] rounded-xl" />
            ) : (
              <img src={preview.url} alt="" className="w-full max-h-[80vh] object-contain rounded-xl" />
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-square bg-card rounded-xl shimmer" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((file) => (
            <div
              key={file.publicId}
              className="group relative bg-card border border-border/30 rounded-xl overflow-hidden hover:border-gold/30 transition-all"
            >
              {/* Thumbnail */}
              <div
                className="aspect-square cursor-pointer overflow-hidden"
                onClick={() => setPreview({ url: file.url, type: file.type })}
              >
                {file.type === "video" ? (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center">
                    <Film className="w-10 h-10 text-white/30" />
                  </div>
                ) : (
                  <img src={file.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                )}
              </div>

              {/* Type badge */}
              <div className="absolute top-2 left-2">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-sans ${
                  file.type === "video" ? "bg-purple-500/80 text-white" : "bg-black/50 text-white/80 backdrop-blur-sm"
                }`}>
                  {file.format}
                </span>
              </div>

              {/* Hover overlay with actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => copyUrl(file.url, file.publicId)}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                  title="Kopjo URL"
                >
                  {copiedId === file.publicId ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setDeleteId({ publicId: file.publicId, type: file.type })}
                  className="p-2 bg-red-500/50 backdrop-blur-sm rounded-lg text-white hover:bg-red-500/70 transition-colors"
                  title="Fshi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* File info */}
              <div className="p-2">
                <p className="text-[10px] text-foreground font-sans truncate">{file.publicId.split("/").pop()}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[9px] text-muted-foreground font-sans">{formatBytes(file.bytes)}</span>
                  <span className="text-[9px] text-muted-foreground font-sans">{formatDate(file.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            {search || filter !== "all" ? "Asnjë skedar nuk përputhet" : "Asnjë media akoma"}
          </h3>
          <p className="text-sm text-muted-foreground font-sans mb-4">
            {search || filter !== "all" ? "Provoni filtra të ndryshëm" : "Ngarkoni foto dhe video në librarinë tuaj"}
          </p>
          {!search && filter === "all" && (
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-navy-dark font-bold text-sm rounded-lg hover:bg-gold-light transition-colors cursor-pointer font-sans">
              <Upload className="w-4 h-4" />
              Ngarko Skedarin e Parë
              <input type="file" accept="image/*,video/*" multiple onChange={handleUpload} className="hidden" />
            </label>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
