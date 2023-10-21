const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
   console.log(`Server started on http://localhost:${PORT}`);
});