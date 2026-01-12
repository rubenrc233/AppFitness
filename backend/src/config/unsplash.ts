import { createApi } from 'unsplash-js';

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || 'TMRwHUA4BzbzpIFHMcAe28KuTiUGeOV-dK_CeYOGerM'
});

export async function searchRecipeImage(recipeName: string): Promise<string | null> {
  try {
    const result = await unsplash.search.getPhotos({
      query: recipeName,
      page: 1,
      perPage: 1,
      orientation: 'landscape'
    });

    if (result.type === 'success' && result.response.results.length > 0) {
      return result.response.results[0].urls.regular;
    }
    
    return null;
  } catch (error) {
    console.error('Error searching Unsplash:', error);
    return null;
  }
}

export default unsplash;
