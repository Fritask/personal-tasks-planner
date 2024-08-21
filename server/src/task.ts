import * as mongodb from 'mongodb';

export interface Task {
	title: string;
	priority: 'high' | 'medium' | 'low';
    completed: boolean;
	_id?: mongodb.ObjectId;
}
