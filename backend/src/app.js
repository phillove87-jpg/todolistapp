const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../../swagger/swagger.json');
const corsOptions = require('./config/corsConfig');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./middlewares/errorHandler');
const routes = require('./routes/index');

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(requestLogger);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api', routes);

app.use(errorHandler);

module.exports = app;
