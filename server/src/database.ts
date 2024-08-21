import * as mongodb from 'mongodb';
import { Task } from './task';

export const collections: {
	tasks?: mongodb.Collection<Task>;
} = {};

export async function connectToDatabase(uri: string) {
	const client = new mongodb.MongoClient(uri);
	await client.connect();

	const db = client.db('personalTasks');
	await applySchemaValidation(db);

	const tasksCollection = db.collection<Task>('tasks');
	collections.tasks = tasksCollection;
}

// Update our existing collection with JSON schema validation so we know our documents will always match the shape of our Task model, even if added elsewhere.
// For more information about schema validation, see this blog series: https://www.mongodb.com/blog/post/json-schema-validation--locking-down-your-model-the-smart-way
async function applySchemaValidation(db: mongodb.Db) {
	const jsonSchema = {
		$jsonSchema: {
			bsonType: 'object',
			required: ['title', 'priority', 'completed'],
			additionalProperties: false,
			properties: {
				_id: {},
				title: {
					bsonType: 'string',
					description: "'title' is required and is a string",
				},
				priority: {
					bsonType: 'string',
					description:
						"'priority' is required and is one of 'high', 'medium' or 'low'",
					enum: ['high', 'medium', 'low'],
				},
				completed: {
					bsonType: 'bool',
					description: "'completed' is required and is a boolean",
				},
			},
		},
	};

	// Try applying the modification to the collection, if the collection doesn't exist, create it
	await db
		.command({
			collMod: 'tasks',
			validator: jsonSchema,
		})
		.catch(async (error: mongodb.MongoServerError) => {
			if (error.codeName === 'NamespaceNotFound') {
				await db.createCollection('tasks', {
					validator: jsonSchema,
				});
			}
		});
}
