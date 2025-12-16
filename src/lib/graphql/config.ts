// GraphQL 配置 - Single Source of Truth
const endpoint = process.env.GRAPHQL_ENDPOINT;
if (!endpoint) {
	throw new Error("Missing GRAPHQL_ENDPOINT environment variable");
}
export const GRAPHQL_ENDPOINT: string = endpoint;
