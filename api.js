var express = require('express');
var crypto = require('crypto');

var pontodb = require('./pontodb.js');
var config = require('./config.js');

var app = express();
var router = express.Router();

function encrypt(obj) {
	if (obj == null) obj = [];
	var cipher = crypto.createCipheriv(config.api.cipher, config.api.key, config.api.iv);
	var crypted = cipher.update(JSON.stringify(obj), 'utf-8', 'hex');
	crypted += cipher.final('hex');
	return crypted;
}

router.get('/servidor/:id', function(req, res) {
	pontodb.servidor(req.params.id, function(err, rows) {
		if (err)
			res.json(err);
		else
		// res.json(rows);
	res.json({
		result: encrypt(rows)
	});
});
});

router.get('/pontos/:id/:mes/:ano', function(req, res) {
	pontodb.pontos(req.params.id, req.params.mes, req.params.ano, function(err, rows) {
		if (err)
			res.json(err);
		else
	//	res.json(rows);
res.json({		result: encrypt(rows)	});
});
});

router.get('/ultima_atualizacao', function(req, res) {
	pontodb.ultima_atualizacao(function(err, rows) {
		if (err)
			res.json(err);
		else
		//res.json(rows);
	res.json({
		result: encrypt(rows)
	});
});
});

router.get('/sumario/:id/:mes/:ano', function(req, res) {
	console.log(req.params.id, req.params.mes, req.params.ano);

	pontodb.sumario(req.params.id, req.params.mes, req.params.ano, function(err, rows) {
		if (err)
			res.json(err);
		else
		//	res.json(rows);
	res.json({
		result: encrypt(rows)
	});
});
});

router.get('/legendas/:id/:mes/:ano', function(req, res) {
	console.log('legendas', req.params.id, req.params.mes, req.params.ano);

	pontodb.legendas(req.params.id, req.params.mes, req.params.ano, function(err, rows) {
		if (err)
			res.json(err);
		else
	res.json(rows);
	//res.json({	result: encrypt(rows)	});
});
});

router.get('/departamento/:id/:mes/:ano', function(req, res) {
	console.log(req.params.id, req.params.mes, req.params.ano);

	pontodb.departamento(req.params.id, req.params.mes, req.params.ano, function(err, rows) {
		if (err)
			res.json(err);
		else
		//res.json(rows);
	res.json({
		result: encrypt(rows)
	});
});
});


//-------------------------Horarios dos servidor--------------------------------

router.get('/horarios/:id', function(req, res) {
	pontodb.horarios(req.params.id, function(err, rows) {
		if (err)
			res.json(err);
		else
			res.json(rows);
			//res.json({result: encrypt(rows)	});
	});
});

//--------------------------Verifica se e um chefe------------------------------

router.get('/chefia/:usuario', function(req, res) {
	pontodb.chefia(req.params.usuario, function(err, rows) {
		if (err)
			res.json(err);
		else
			//res.json(rows);
			res.json({result: encrypt(rows)	});
	});
});

//----------------------------Dados do Chefe-----------------------------------

router.get('/chefiaDados/:usuario', function(req, res) {
	pontodb.chefiaDados(req.params.usuario, function(err, rows) {
		if (err)
			res.json(err);
		else{
		//	console.log(rows);
						res.json(rows);
			res.json({result: encrypt(rows)	});

		}
		
			
	});
});


//-----------------------------Ocorrecias Por Setor e  por  pessoa -----------------------------

router.get('/ocorrencias/:mes/:ano/:departamento/:siape', function(req, res) {
	pontodb.ocorrencias(req.params.mes,req.params.ano,req.params.departamento,req.params.siape, function(err, rows) {
		if (err){
			console.log('ERRO!')
			res.json(err);
		}
		else
			{
			//console.log(rows);
			res.json({result: encrypt(rows)	});
			//res.json(rows);
		}
			
	});
});

//-------------------------------------------------------------------------------
app.use('/api', router);

pontodb.connect(function(err) {
	if (err)
		return console.error('Error connecting do database: ' + err.message);

	app.listen(config.api.port, config.api.host);
	console.log('Listening on', config.api.host + ':' + config.api.port);
});