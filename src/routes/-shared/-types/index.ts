// 共享类型工具

/**
 * 从数组类型中提取元素类型
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * 从可空类型中提取非空类型
 */
export type NonNullableDeep<T> = T extends null | undefined
	? never
	: T extends object
		? { [K in keyof T]: NonNullableDeep<T[K]> }
		: T;

/**
 * 从 GraphQL 连接类型中提取节点数组的元素类型
 * 自动处理可空类型
 * 例如: ExtractNode<PostsListQuery['posts']> => Post
 */
export type ExtractNode<T> =
	NonNullable<T> extends { nodes: infer N }
		? N extends readonly (infer U)[]
			? U
			: never
		: never;
