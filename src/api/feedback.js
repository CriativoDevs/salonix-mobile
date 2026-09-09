import client from "./client";

function buildHeaders({ slug } = {}) {
  const headers = {};
  if (slug) {
    headers["X-Tenant-Slug"] = slug;
  }
  return headers;
}

export async function submitFeedback(
  { category, custom_category, rating, message, anonymous = false },
  { slug } = {}
) {
  const headers = buildHeaders({ slug });
  const payload = {
    category,
    ...(custom_category ? { custom_category } : {}),
    rating,
    message,
    is_anonymous: Boolean(anonymous),
  };

  const response = await client.post("feedbacks/", payload, { headers });
  return response.data;
}

export default { submitFeedback };
