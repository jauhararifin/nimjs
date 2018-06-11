import * as express from "express";
import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import * as compression from 'compression';
import * as morgan from 'morgan';

import * as model from '../model';
import * as crawler from '../crawler';
import * as faculty from '../faculty';
import * as major from '../major';
import * as student from '../student';
import * as log from '../log';
import * as mongoose from "mongoose";

dotenv.config();

// initialize default mongoose connection
const mongooseDefaultConnection = mongoose.createConnection(process.env.MONGO_CONNECTION);
mongooseDefaultConnection.on('error', err => {
  console.log('Mongoose default connection error: ' + err);
  process.exit();
}); 
mongooseDefaultConnection.on('disconnected', () => console.log('Mongoose default disconnected'));
mongooseDefaultConnection.on('connected', () => console.log('Mongoose default connected'));

// initialize default mongoose models
const defaultFacultyModel = model.createFacultyModel(mongooseDefaultConnection);
const defaultMajorModel = model.createMajorModel(mongooseDefaultConnection);
const defaultStudentModel = model.createStudentModel(mongooseDefaultConnection);
const defaultLogModel = model.createLogModel(mongooseDefaultConnection);

// initialize crawler endpoint
if (process.env.AI3_ACCOUNT_USERNAME === undefined || process.env.AI3_ACCOUNT_PASSWORD === undefined) {
  console.log('missing ai3 account configuration in environment variables');
  process.exit();
}
const crawlerController = new crawler.CrawlerController(
  process.env.AI3_ACCOUNT_USERNAME, process.env.AI3_ACCOUNT_PASSWORD,
  defaultFacultyModel,
  defaultMajorModel,
  defaultStudentModel,
  defaultLogModel
);

// initialize controllers
const facultyController = new faculty.FacultyController(defaultFacultyModel);
const majorController = new major.MajorController(defaultFacultyModel, defaultMajorModel);
const studentController = new student.StudentController(defaultStudentModel);
const logController = new log.LogController(defaultLogModel);

// initialize api endpoint
const apiRouter = express.Router();
apiRouter.use(crawlerController.getRouter());
apiRouter.use(facultyController.getRouter());
apiRouter.use(majorController.getRouter());
apiRouter.use(studentController.getRouter());
apiRouter.use(logController.getRouter());

// add error handler for api
apiRouter.use((err, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(err);
  res.status(500).json({'error': 'internal server error'});
});

export const app = express();

// configure express
app.set('port', process.env.PORT || 3000);
app.set('env', process.env.NODE_ENV || 'development');
app.use(morgan('combined'));
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/v1', apiRouter);
