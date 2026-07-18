import type { APIRoute } from 'astro';
import { createVisualResponse, getVisualStaticPaths } from '../../../utils/visual-artifacts';

export const prerender = true;
export const getStaticPaths = getVisualStaticPaths;

export const GET: APIRoute = ({ params, site }) => (
  createVisualResponse(params.slug ?? '', 'ja', site?.toString() ?? 'https://redreamality.com')
);
