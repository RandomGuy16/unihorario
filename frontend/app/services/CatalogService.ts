import { Catalog } from "@/app/models/Catalog";
import { AwaitJobResponse } from "@/app/models/dto";


export const CatalogService = {
  /**
   * This function fetches the Catalog from the server.
   * @returns the catalog
   */
  async fetchCatalog(): Promise<Catalog> {
    const baseUrl = process.env.API_BASE_URL || "http://localhost:8080"
    const response = await fetch(`${baseUrl}/api/catalog`)
    // const response = await fetch('./catalog.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  },
  async awaitCatalogRefresh(catalogRefreshJobId: string): Promise<Catalog> {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
    const response = await fetch(`${baseUrl}/api/jobs/await_job/${catalogRefreshJobId}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data: AwaitJobResponse<Catalog> = await response.json()
    if (!data.success) throw new Error('Catalog refresh job failed')
    return data.result
  }

}
