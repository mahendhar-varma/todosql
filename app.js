const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());
module.exports = app;

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3006, () => {
      console.log("SERVER RUNNING SUCCESSFULLY AT http://localhost:3006");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperties = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusProperties = (requestQuery) => {
  return requestQuery.status !== undefined;
};
//API 1
app.get("/todos/", async (request, response) => {
  const { status, priority, search_q = "" } = request.query;

  let getTodoDataQuery = "";
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoDataQuery = `
            SELECT 
               * 
            FROM todo 
            WHERE priority LIKE '${priority}' 
            AND status LIKE '${status}'
            AND todo LIKE '${search_q}';
        `;
      break;
    case hasPriorityProperties(request.query):
      getTodoDataQuery = `
            SELECT * 
            FROM todo 
            WHERE priority LIKE '${priority}'
            AND todo LIKE '${search_q}';
        `;
      break;
    case hasStatusProperties(request.query):
      getTodoDataQuery = `
        SELECT * 
        FROM todo 
        WHERE status LIKE '${status}'
        AND todo LIKE '${search_q}';
        `;
      break;
    default:
      getTodoDataQuery = `
            SELECT * 
            FROM todo 
            WHERE todo LIKE '${search_q}'
        `;
      break;
  }
  const responseData = await db.all(getTodoDataQuery);
  response.send(responseData);
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getDataOnTodoIdQuery = `
        SELECT * 
        FROM todo 
        WHERE id = '${todoId}';
        ;
    `;

  const responseData = await db.get(getDataOnTodoIdQuery);
  response.send({
    id: responseData["id"],
    todo: responseData["todo"],
    priority: responseData["priority"],
    status: responseData["status"],
  });
});

//API 3
app.post("/todos/", async (request, response) => {
  const requestDetails = request.body;
  const { id, todo, priority, status } = requestDetails;
  const postQuery = `
    INSERT INTO 
    todo (id, todo, priority, status) 
    VALUES(
        '${id}',
        '${todo}',
        '${priority}',
        '${status}'
    );
    `;
  await db.run(postQuery);
  response.send("Todo Successfully Added");
});

//API 4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let responseText = "";
  switch (true) {
    case requestBody.todo !== undefined:
      responseText = "Todo Updated";
      break;
    case requestBody.priority !== undefined:
      responseText = "Priority Updated";
      break;
    case requestBody.status !== undefined:
      responseText = "Status Updated";
      break;
  }
  const previousTodoQuery = `
      SELECT * 
      FROM todo 
      WHERE id = '${todoId}';
  `;
  const previousTodo = await db.get(previousTodoQuery);
  console.log(previousTodo);
  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = request.body;

  const updateQuery = `
    UPDATE todo 
    SET 
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
    WHERE id = '${todoId}';
    `;

  await db.run(updateQuery);
  response.send(responseText);
});

//API 5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
        DELETE FROM todo 
        WHERE id = '${todoId}';
    `;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});
