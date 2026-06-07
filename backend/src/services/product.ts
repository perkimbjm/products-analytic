import { productRepository } from '../repositories/product.js';
import { type ProductFilter } from '../repositories/product.js';
import { getLookups } from '../lib/lookups.js';
import type { Product, Location } from '../types/index.js';

export interface EnrichedProduct extends Product {
  category_name?: string;
  segment_name?: string;
  location?: Location;
}

export class ProductService {
  getProductsWithRelations(filter?: ProductFilter): EnrichedProduct[] {
    const products = productRepository.getAll(filter);
    const { categories, segments, locations } = getLookups();

    return products.map((p) => ({
      ...p,
      category_name: categories.get(p.category_id)?.name,
      segment_name: segments.get(p.segment_id)?.name,
      location: locations.get(p.location_id),
    }));
  }

  countWithFilter(filter?: ProductFilter): number {
    return productRepository.count(filter);
  }

  getProductById(id: number): EnrichedProduct | undefined {
    const product = productRepository.getById(id);
    if (!product) return undefined;

    const { categories, segments, locations } = getLookups();

    return {
      ...product,
      category_name: categories.get(product.category_id)?.name,
      segment_name: segments.get(product.segment_id)?.name,
      location: locations.get(product.location_id),
    };
  }
}

export const productService = new ProductService();
