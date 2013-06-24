
require! 'express'

app = express!

app.listen 3000

app.use (req, res, next) ->
	res.send 404