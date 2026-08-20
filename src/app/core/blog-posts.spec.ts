import { BLOG_POSTS, findBlogPost } from './blog-posts';

describe('blog post catalog', () => {
  it('publishes uniquely addressable foundational articles and progress reports', () => {
    expect(BLOG_POSTS).toHaveLength(5);
    expect(new Set(BLOG_POSTS.map((post) => post.slug)).size).toBe(BLOG_POSTS.length);
    expect(BLOG_POSTS.every((post) => post.sections.length >= 3)).toBe(true);
  });

  it('finds a known article without substituting for an unknown slug', () => {
    expect(findBlogPost('inside-script-visualizer')?.category).toBe('Product');
    expect(findBlogPost('missing-article')).toBeUndefined();
  });
});
