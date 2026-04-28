const userRepo = require('./src/repositories/userRepository');
const categoryRepo = require('./src/repositories/categoryRepository');
const todoRepo = require('./src/repositories/todoRepository');
const db = require('./src/db/dbClient');

async function validate() {
  try {
    console.log('--- DB-07 Validation Started ---');

    // 1. Create User
    const user = await userRepo.createUser('test@example.com', 'hashed_password');
    console.log('1. User created:', user.email);

    // 2. UNIQUE constraint (Email)
    try {
      await userRepo.createUser('test@example.com', 'another_password');
      console.error('FAILED: Email UNIQUE constraint not working');
    } catch (err) {
      console.log('2. Email UNIQUE constraint working:', err.message);
    }

    // 3. Create Category
    const category = await categoryRepo.createCategory(user.id, 'Work');
    console.log('3. Category created:', category.name);

    // 4. UNIQUE constraint (User + Category Name)
    try {
      await categoryRepo.createCategory(user.id, 'Work');
      console.error('FAILED: Category UNIQUE constraint not working');
    } catch (err) {
      console.log('4. Category UNIQUE constraint working:', err.message);
    }

    // 5. Create Todo
    const todo = await todoRepo.createTodo({
      title: 'Finish Plan',
      userId: user.id,
      categoryId: category.id
    });
    console.log('5. Todo created:', todo.title);

    // 6. Trigger set_updated_at
    const initialUpdatedAt = todo.updatedAt;
    await new Promise(resolve => setTimeout(resolve, 1100)); // wait > 1s
    const updatedTodo = await todoRepo.updateTodo(todo.id, { title: 'Finish Plan (Updated)' });
    if (updatedTodo.updatedAt > initialUpdatedAt) {
      console.log('6. Trigger set_updated_at working');
    } else {
      console.error('FAILED: Trigger set_updated_at not working');
    }

    // 7. FK SET NULL (Category delete)
    await categoryRepo.deleteCategory(category.id);
    const todoAfterCategoryDelete = await todoRepo.getTodoById(todo.id);
    if (todoAfterCategoryDelete && todoAfterCategoryDelete.categoryId === null) {
      console.log('7. FK SET NULL working (Category delete -> Todo.category_id = NULL)');
    } else {
      console.error('FAILED: FK SET NULL not working');
    }

    // 8. FK CASCADE (User delete)
    await db.query('DELETE FROM users WHERE id = $1', [user.id]);
    const todoAfterUserDelete = await todoRepo.getTodoById(todo.id);
    if (!todoAfterUserDelete) {
      console.log('8. FK CASCADE working (User delete -> Todo deleted)');
    } else {
      console.error('FAILED: FK CASCADE not working');
    }

    console.log('--- DB-07 Validation Completed Successfully ---');
    process.exit(0);
  } catch (err) {
    console.error('Validation failed with error:', err);
    process.exit(1);
  }
}

validate();
