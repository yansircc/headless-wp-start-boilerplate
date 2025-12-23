import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { print } from "graphql";
import { GRAPHQL_ENDPOINT } from "./config";

/**
 * GraphQL Error type
 */
type GraphQLError = {
	message: string;
	locations?: Array<{ line: number; column: number }>;
	path?: Array<string | number>;
};

/**
 * GraphQL Response type
 */
type GraphQLResponse<T> = {
	data?: T;
	errors?: GraphQLError[];
};

/**
 * Parse URL and extract Basic Auth credentials if present
 * Cloudflare Workers fetch doesn't support credentials in URL
 */
function parseEndpoint(endpoint: string): {
	url: string;
	authHeader?: string;
} {
	try {
		const parsed = new URL(endpoint);

		if (parsed.username || parsed.password) {
			// Extract credentials and create Authorization header
			const credentials = btoa(`${parsed.username}:${parsed.password}`);
			// Remove credentials from URL
			parsed.username = "";
			parsed.password = "";

			return {
				url: parsed.toString(),
				authHeader: `Basic ${credentials}`,
			};
		}

		return { url: endpoint };
	} catch {
		return { url: endpoint };
	}
}

// Parse endpoint once at module load
const { url: graphqlUrl, authHeader } = parseEndpoint(GRAPHQL_ENDPOINT);

/**
 * Type-safe GraphQL request wrapper using native fetch
 * Compatible with Cloudflare Workers (no node:http dependency)
 * Supports HTTP Basic Auth via URL credentials
 */
export async function graphqlRequest<TResult, TVariables>(
	document: TypedDocumentNode<TResult, TVariables>,
	...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): Promise<TResult> {
	const query = print(document);

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		Accept: "application/json",
	};

	// Add Authorization header if credentials were in URL
	if (authHeader) {
		headers.Authorization = authHeader;
	}

	const response = await fetch(graphqlUrl, {
		method: "POST",
		headers,
		body: JSON.stringify({
			query,
			variables: variables ?? undefined,
		}),
	});

	if (!response.ok) {
		throw new Error(
			`GraphQL request failed: ${response.status} ${response.statusText}`
		);
	}

	const json = (await response.json()) as GraphQLResponse<TResult>;

	if (json.errors?.length) {
		const errorMessages = json.errors.map((e) => e.message).join(", ");
		throw new Error(`GraphQL errors: ${errorMessages}`);
	}

	if (!json.data) {
		throw new Error("GraphQL response missing data");
	}

	return json.data;
}
