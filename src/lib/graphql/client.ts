import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import request, { type RequestDocument } from "graphql-request";
import { GRAPHQL_ENDPOINT } from "./config";

/**
 * Type-safe GraphQL request wrapper
 * 使用 TypedDocumentNode 保证类型安全
 */
export async function graphqlRequest<TResult, TVariables>(
	document: TypedDocumentNode<TResult, TVariables>,
	...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): Promise<TResult> {
	return await request<TResult>(
		GRAPHQL_ENDPOINT,
		document as RequestDocument,
		variables as Record<string, unknown>
	);
}
