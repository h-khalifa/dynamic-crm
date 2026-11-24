import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
import remarkGfm from "remark-gfm";
import { getPost, listPosts } from "@/lib/blog";
import { formatDate } from "@/lib/utils";

export async function generateStaticParams() {
  return (await listPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug);
  return post ? { title: post.meta.title, description: post.meta.excerpt } : {};
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
        ← All posts
      </Link>
      <h1 className="mt-6 text-4xl font-bold tracking-tight">{post.meta.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {formatDate(post.meta.date)} · {post.meta.author}
      </p>
      <div className="prose prose-slate mt-10 max-w-none">
        <MDXRemote source={post.content} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
      </div>
    </article>
  );
}
