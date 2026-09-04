// Real Google reviews for the salon, fetched server-side via the Places API
// (New) — never fabricated. Requires two env vars (see .env.example):
//
//   GOOGLE_PLACES_API_KEY — a Google Cloud API key with the "Places API
//     (New)" enabled. https://console.cloud.google.com/apis/library
//   GOOGLE_PLACE_ID — the salon's Google Place ID, found with Google's
//     Place ID Finder: https://developers.google.com/maps/documentation/places/web-service/place-id
//
// Both must be set (in Vercel's env vars, not committed) before this
// section renders anything — see getGoogleReviews()'s null return.
//
// Google's API caps this at 5 reviews per place, chosen by Google's own
// relevance ranking — there is no way to pull the full review history via
// API. The section links out to the real Google listing for the rest.

export type DebsGoogleReview = {
  authorName: string;
  authorPhotoUrl: string | null;
  rating: number;
  text: string;
  relativeTime: string;
};

export type DebsGoogleReviewsData = {
  rating: number;
  userRatingCount: number;
  reviews: DebsGoogleReview[];
  googleMapsUrl: string;
};

type PlacesApiResponse = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: Array<{
    rating?: number;
    text?: { text?: string };
    relativePublishTimeDescription?: string;
    authorAttribution?: { displayName?: string; photoUri?: string };
  }>;
};

/** Returns `null` if unconfigured or the API call fails — the reviews section renders nothing rather than a broken/empty state. */
export async function getGoogleReviews(): Promise<DebsGoogleReviewsData | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!apiKey || !placeId) return null;

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews",
      },
      // Places API is billed per request — cache for an hour rather than refetching on every visit.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as PlacesApiResponse;
    if (!data.reviews?.length) return null;

    return {
      rating: data.rating ?? 0,
      userRatingCount: data.userRatingCount ?? 0,
      googleMapsUrl: data.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${placeId}`,
      reviews: data.reviews
        .filter((r) => r.text?.text)
        .map((r) => ({
          authorName: r.authorAttribution?.displayName ?? "",
          authorPhotoUrl: r.authorAttribution?.photoUri ?? null,
          rating: r.rating ?? 0,
          text: r.text!.text!,
          relativeTime: r.relativePublishTimeDescription ?? "",
        })),
    };
  } catch {
    return null;
  }
}
