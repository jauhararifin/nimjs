
import { Schema, Connection, Model, Document, connection } from 'mongoose';

export const facultySchema = new Schema({

  code: {
    type: String,
    index: true,
    unique: true
  },

  name: String,

  createdAt: { type: Date, default: Date.now },

  updatedAt: { type: Date, default: Date.now},

});

export interface FacultyModel extends Model<Document> {
}

export const createModel = (conn: Connection = connection): FacultyModel => conn.model('crawler.faculty', facultySchema);
