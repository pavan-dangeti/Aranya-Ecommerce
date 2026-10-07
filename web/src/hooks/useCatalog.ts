import { useQuery } from '@tanstack/react-query'
import type { CategoryId } from '@aranya/shared'
import { catalogApi } from '@/lib/api'

export function useCategories() {
  return useQuery<Array<{ id: CategoryId; name: string; tagline: string }>>({
    queryKey: ['categories'],
    queryFn: () => catalogApi.categories(),
  })
}

export function useIngredients() {
  return useQuery<
    Array<{
      id: string
      name: string
      sanskritName: string
      latinName: string
      origin: string
      traditionalCategory: string
      description: string
      foundIn: string[]
      palette: { deep: string; soft: string; accent: string }
    }>
  >({
    queryKey: ['ingredients'],
    queryFn: () => catalogApi.ingredients(),
  })
}

export function useArticles() {
  return useQuery<
    Array<{
      slug: string
      title: string
      excerpt: string
      readTime: string
      topic: string
      date: string
      pullQuote: string
      sections: Array<{ heading?: string; paragraphs: string[] }>
    }>
  >({
    queryKey: ['articles'],
    queryFn: () => catalogApi.articles(),
  })
}

export function useArticle(slug: string) {
  return useQuery<{
    slug: string
    title: string
    excerpt: string
    readTime: string
    topic: string
    date: string
    pullQuote: string
    sections: Array<{ heading?: string; paragraphs: string[] }>
  }>({
    queryKey: ['article', slug],
    queryFn: () => catalogApi.articleBySlug(slug),
    enabled: !!slug,
  })
}

export function useTestimonials() {
  return useQuery<Array<{ id: string; name: string; city: string; rating: number; quote: string }>>(
    {
      queryKey: ['testimonials'],
      queryFn: () => catalogApi.testimonials(),
    },
  )
}

export function useFaqs() {
  return useQuery<Array<{ question: string; answer: string }>>({
    queryKey: ['faqs'],
    queryFn: () => catalogApi.faqs(),
  })
}
