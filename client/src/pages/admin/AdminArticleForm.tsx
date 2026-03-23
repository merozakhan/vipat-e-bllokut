import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "./AdminLayout";

const PLACEMENTS = [
  { value: "", label: "None" },
  { value: "breaking", label: "Breaking" },
  { value: "trending", label: "Trending" },
  { value: "hot", label: "Hot" },
  { value: "most_read", label: "Më të lexuarat" },
];

export default function AdminArticleForm() {
  const params = useParams<{ id: string }>();
  const isEdit = !!params.id;
  const [, navigate] = useLocation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [selectedCats] = useState<number[]>([]);
  const [placement, setPlacement] = useState("");
  const [position, setPosition] = useState(1);
  const [uploading, setUploading] = useState(false);

  const { data: existing } = trpc.admin.articlesGetById.useQuery(
    { id: parseInt(params.id || "0") },
    { enabled: isEdit }
  );

  const utils = trpc.useUtils();
  const createMutation = trpc.admin.articlesCreate.useMutation({
    onSuccess: (data) => { toast.success("Article created"); navigate("/admin/articles"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.admin.articlesUpdate.useMutation({
    onSuccess: () => { toast.success("Article updated"); utils.admin.articlesList.invalidate(); navigate("/admin/articles"); },
    onError: (e) => toast.error(e.message),
  });
  const uploadMutation = trpc.admin.uploadImage.useMutation();

  // Load existing article data for edit
  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setContent(existing.content);
      setExcerpt(existing.excerpt || "");
      setFeaturedImage(existing.featuredImage || "");
      setStatus(existing.status as "draft" | "published");
      setPlacement(existing.homepagePlacement || "");
      setPosition(existing.homepagePosition || 1);
    }
  }, [existing]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      const filename = file.name.replace(/\.[^.]+$/, "") + "-" + Date.now();
      const result = await uploadMutation.mutateAsync({ base64, filename });
      setFeaturedImage(result.url);
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error("Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  }, [uploadMutation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      title,
      content: content.includes("<p>") ? content : content.split("\n").filter(p => p.trim()).map(p => `<p>${p}</p>`).join(""),
      excerpt: excerpt || undefined,
      featuredImage: featuredImage || undefined,
      status,
      categoryIds: selectedCats.length > 0 ? selectedCats : undefined,
      homepagePlacement: placement ? placement as any : null,
      homepagePosition: placement ? position : null,
    };

    if (isEdit) {
      updateMutation.mutate({ id: parseInt(params.id!), ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/admin/articles")} className="p-1.5 rounded-lg hover:bg-card text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-black text-foreground">{isEdit ? "Edit Article" : "New Article"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-card border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 font-sans"
            placeholder="Article title"
            required
          />
        </div>

        {/* Featured Image */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans mb-1.5">Featured Image</label>
          {featuredImage ? (
            <div className="relative rounded-lg overflow-hidden border border-border/50">
              <img src={featuredImage} alt="Featured" className="w-full h-48 object-cover" />
              <button
                type="button"
                onClick={() => setFeaturedImage("")}
                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-border/50 rounded-lg cursor-pointer hover:border-gold/50 transition-colors">
              {uploading ? (
                <div className="animate-spin w-6 h-6 border-2 border-gold border-t-transparent rounded-full" />
              ) : (
                <>
                  <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center">
                    <Upload className="w-6 h-6 text-gold" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Click to upload image</p>
                    <p className="text-xs text-muted-foreground font-sans">JPG, PNG up to 10MB</p>
                  </div>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          )}
          {/* Or paste URL */}
          <input
            type="text"
            value={featuredImage}
            onChange={(e) => setFeaturedImage(e.target.value)}
            className="w-full mt-2 px-4 py-2 bg-card border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 font-sans"
            placeholder="Or paste image URL"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans mb-1.5">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full px-4 py-3 bg-card border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 font-sans text-sm leading-relaxed resize-y"
            placeholder="Write your article content here. Each paragraph on a new line. HTML is supported."
            required
          />
          <p className="text-[10px] text-muted-foreground font-sans mt-1">Plain text (auto-wrapped in paragraphs) or HTML.</p>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans mb-1.5">Excerpt (optional)</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 bg-card border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 font-sans text-sm resize-y"
            placeholder="Short summary (auto-generated from content if empty)"
          />
        </div>

        {/* Homepage Placement */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans mb-1.5">Homepage Section</label>
            <select
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              className="w-full px-4 py-2.5 bg-card border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 font-sans text-sm"
            >
              {PLACEMENTS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          {placement && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans mb-1.5">Position (1-5)</label>
              <select
                value={position}
                onChange={(e) => setPosition(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-card border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 font-sans text-sm"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Status + Submit */}
        <div className="flex items-center gap-4 pt-4 border-t border-border/50">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            className="px-4 py-2.5 bg-card border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 font-sans text-sm"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <button
            type="submit"
            disabled={isPending || !title || !content}
            className="flex-1 py-2.5 bg-gold text-navy-dark font-bold text-sm rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50 font-sans"
          >
            {isPending ? "Saving..." : isEdit ? "Update Article" : "Create Article"}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
