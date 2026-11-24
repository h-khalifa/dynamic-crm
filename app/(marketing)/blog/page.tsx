import Link from "next/link";
import { listPosts } from "@/lib/blog";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Blog" };

export default async function BlogIndex() {
  const posts = await listPosts();
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
      <p className="mt-3 text-muted-foreground">Product news and ideas on running a CRM that fits your business.</p>
      <div className="mt-10 divide-y">
        {posts.map((p) => (
          <article key={p.slug} className="py-6">
            <time className="text-xs text-muted-foreground">{formatDate(p.date)}</time>
            <h2 className="mt-1 text-xl font-semibold">
              <Link href={`/blog/${p.slug}`} className="hover:text-primary">
                {p.title}
              </Link>
            </h2>
            <p className="mt-2 text-muted-foreground">{p.excerpt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
