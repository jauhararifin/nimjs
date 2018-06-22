import * as express from "express";
import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import * as compression from 'compression';
import * as morgan from 'morgan';
import * as yamljs from 'yamljs';
import * as actuator from 'express-actuator';
import * as passport from 'passport';
import * as cors from 'cors';
import { BasicStrategy } from 'passport-http';

import * as model from '../model';
import * as crawler from '../crawler';
import * as faculty from '../faculty';
import * as major from '../major';
import * as student from '../student';
import * as log from '../log';
import * as searcher from '../searcher';
import * as mongoose from "mongoose";
import * as swagger from 'swagger-ui-express';

dotenv.config();

// initialize default mongoose connection
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log('connected to mongo database'))
.catch(err => {
  console.log('failed connect to mongo database ', err);
  process.exit();
});

// initialize crawler endpoint
if (process.env.AI3_ACCOUNT_USERNAME === undefined || process.env.AI3_ACCOUNT_PASSWORD === undefined) {
  console.log('missing ai3 account configuration in environment variables');
  process.exit();
}
const crawlerController = new crawler.CrawlerController(process.env.AI3_ACCOUNT_USERNAME, process.env.AI3_ACCOUNT_PASSWORD,);

// initialize controllers
const facultyController = new faculty.FacultyController();
const majorController = new major.MajorController();
const studentController = new student.StudentController();
const logController = new log.LogController();
const searcherController = new searcher.SearcherController();

// initialize api endpoint
const apiRouter = express.Router();
apiRouter.use(crawlerController.getRouter());
apiRouter.use(facultyController.getRouter());
apiRouter.use(majorController.getRouter());
apiRouter.use(studentController.getRouter());
apiRouter.use(logController.getRouter());
apiRouter.use(searcherController.getRouter());

// add error handler for api
apiRouter.use((err, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(err);
  res.status(500).json({
    'code': 500,
    'message': 'internal server error'
  });
});

// swagger admin
const apiSpec = yamljs.load('api.yaml');
const swaggerRouter = express.Router();
swaggerRouter.use('/', swagger.serve, swagger.setup(apiSpec));

// auth
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
passport.use(new BasicStrategy((userid, password, done) => {
  if (userid !== adminUsername || password !== adminPassword) {
    done(null, false);
  } else {
    done(null, true);
  }
}));

export const app = express();

// configure express
app.set('port', process.env.PORT || 3000);
app.set('env', process.env.NODE_ENV || 'development');
app.use(morgan('combined'));
app.use(compression());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/v1', apiRouter);
app.use('/swagger', swaggerRouter);
app.use(actuator('/management'));
