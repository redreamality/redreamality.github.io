import type { APIRoute } from 'astro';
import { createVisualResponse } from '../../../utils/visual-artifacts';

export const prerender = true;

export function getStaticPaths() {
  return [{ params: { slug: 'agent-architecture-showcase' } }];
}

export const GET: APIRoute = ({ site }) => (
  createVisualResponse('agent-architecture-showcase', 'en', site?.toString() ?? 'https://redreamality.com')
);
