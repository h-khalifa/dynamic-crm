import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type PostMeta = { slug: string; title: string; date: string; excerpt: string; author: string };

async function readPost(file: string) {
  const raw = await fs.readFile(path.join(BLOG_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const meta: PostMeta = {
    slug: file.replace(/\.mdx?$/, ""),
    title: String(data.title ?? "Untitled"),
    date: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date ?? ""),
    excerpt: String(data.excerpt ?? ""),
    author: String(data.author ?? "Dynamic-CRM team"),
  };
  return { meta, content };
}

export async function listPosts(): Promise<PostMeta[]> {
  const files = (await fs.readdir(BLOG_DIR)).filter((f) => /\.mdx?$/.test(f));
  const posts = await Promise.all(files.map(async (f) => (await readPost(f)).meta));
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPost(slug: string) {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    return await readPost(`${slug}.mdx`);
  } catch {
    return null;
  }
}
