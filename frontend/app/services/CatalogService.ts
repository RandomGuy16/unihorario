import { Catalog } from "@/app/models/Catalog";


export const CatalogService = {
  /**
   * This function fetches the Catalog from the server.
   * @returns the catalog
   */
  async fetchCatalog(): Promise<Catalog> {
    // const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
    const response = await fetch('./catalog.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  },

  // formatFilters(catalog: Catalog) {
  //   return
  // }
}
