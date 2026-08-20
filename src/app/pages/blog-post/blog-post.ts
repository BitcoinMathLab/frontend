import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { findBlogPost } from '../../core/blog-posts';

@Component({
  selector: 'app-blog-post',
  imports: [RouterLink],
  templateUrl: './blog-post.html',
  styleUrl: './blog-post.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPost {
  private readonly route = inject(ActivatedRoute);

  protected readonly post = findBlogPost(this.route.snapshot.paramMap.get('slug'));
}
