/** One page holding every record, in the `{ data, meta }` shape list endpoints answer with. */
export function onePage<T>(data: T[]) {
  return {
    data,
    meta: {
      page: 1,
      limit: Math.max(data.length, 25),
      count: data.length,
      pages: 1,
      from: data.length > 0 ? 1 : 0,
      to: data.length,
      in: data.length,
      previous: null,
      next: null,
    },
  }
}
