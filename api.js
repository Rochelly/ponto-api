    var express = require('express');
    var crypto = require('crypto');
    var pontodb = require('./pontodb.js');
    var config = require('./config.js');
    var app = express();
    var router = express.Router();
    var domain = require('domain');
    var d = domain.create();
    var fs = require('fs');
    function encrypt(obj) {
        if (obj == null) obj = [];
        var cipher = crypto.createCipheriv(config.api.cipher, config.api.key, config.api.iv);
        var crypted = cipher.update(JSON.stringify(obj), 'utf-8', 'hex');
        crypted += cipher.final('hex');
        return crypted;
    }
    router.get('/servidor/:id', function(req, res) {
        pontodb.servidor(req.params.id, function(err, rows) {
            if (err) {
                throw err;
                res.json(err);
            } else res.json({
                result: encrypt(rows)
            });
        });
    });

    router.get('/pontos/:id/:mes/:ano', function(req, res) {
        pontodb.pontos(req.params.id, req.params.mes, req.params.ano, function(err, rows) {
            if (err) {
                throw err;
                res.json(err);
            } else
            //  res.json(rows);
                res.json({
                result: encrypt(rows)
            });
        });
    });
    router.get('/feriados/:mes/:ano', function(req, res) {
        pontodb.feriados(req.params.mes, req.params.ano, function(err, rows) {
            if (err) {
                throw err;
                res.json(err);
            } else res.json({
                result: encrypt(rows)
            });
        });
    });
    router.get('/ultima_atualizacao', function(req, res) {
        pontodb.ultima_atualizacao(function(err, rows) {
            if (err) {
                throw err;
                res.json(err);
            } else
            //res.json(rows);
                res.json({
                result: encrypt(rows)
            });
        });
    });
    router.get('/legendas/:id/:mes/:ano', function(req, res) {
        pontodb.legendas(req.params.id, req.params.mes, req.params.ano, function(err, rows) {
            if (err) {
                throw err;
                res.json(err);
            } else res.json({
                result: encrypt(rows)
            });
        });
    });
    router.get('/departamento/:id/:mes/:ano', function(req, res) {
        pontodb.departamento(req.params.id, req.params.mes, req.params.ano, function(err, rows) {
            if (err) {
                throw err;
                res.json(err);
            } else res.json({
                result: encrypt(rows)
            });
        });
    });
    //-------------------------Todos os Departamentos---------------------------------------------------------------------------
    router.get('/departamentosAll/', function(req, res) {
        pontodb.departamentosAll(function(err, rows) {
            if (err) {
                throw err;
                res.json(err);
            } else res.json({
                result: encrypt(rows)
            });
        });
    });
    //-------------------------Horarios dos servidor----------------------------------------------------------------------------
    router.get('/horarios/:siape', function(req, res) {
        pontodb.horarios(req.params.siape, function(err, rows) {
            if (err) {
                throw err;
                res.json(err);
            } else res.json({
                result: encrypt(rows)
            });
        });
    });
    //-------------------------Verifica a Existencia de terceira entrada e retorna a quantidade --------------------------------
    router.get('/terceiraentrada/:id/:mes/:ano', function(req, res) {
        pontodb.terceiraEntrada(req.params.id, req.params.mes, req.params.ano, function(err, rows) {
            if (err) {
                throw err;
                res.json(err);
            } else res.json({
                result: encrypt(rows)
            });
        });
    });
    //--------------------------Verifica se e um chefe--------------------------------------------------------------------------
    router.get('/chefia/:usuario', function(req, res) {
        pontodb.chefia(req.params.usuario, function(err, rows) {
            if (err) {
                throw err;
                res.json(err);
            } else res.json({
                result: encrypt(rows)
            });
        });
    });
    //--------------------------Dados do Chefe----------------------------------------------------------------------------------
    router.get('/chefiaDados/:usuario', function(req, res) {
        pontodb.chefiaDados(req.params.usuario, function(err, rows) {
            if (err) {
                throw err;
                res.json(err);
            } else res.json({
                result: encrypt(rows)
            });
        });
    });
    //--------------------------Lista de Funcionarios por Departamento----------------------------------------------------------
    router.get('/funcionariosDep/:Departamento', function(req, res) {
        pontodb.funcionariosDep(req.params.Departamento, function(err, rows) {
            if (err) {
                throw err;
                res.json(err);
            } else {
                res.json({
                    result: encrypt(rows)
                });
            }
        });
    });
    //--------------------------Ocorrecias Por Setor e  por  pessoa ------------------------------------------------------------
    router.get('/ocorrencias/:mes/:ano/:departamento/:siape', function(req, res) {
        pontodb.ocorrencias(req.params.mes, req.params.ano, req.params.departamento, req.params.siape, function(err, rows) {
            if (err) {
                throw err;
                res.json(err);
            } else {
                res.json({
                    result: encrypt(rows)
                });
            }
        });
    });
    //--------------------------Dias Trabalhandos e Nao  trabalhos por pessoa --------------------------------------------------
    router.get('/diasTrabalhados/:mes/:ano/:departamento/:siape', function(req, res) {
        pontodb.diasTrabalhados(req.params.mes, req.params.ano, req.params.departamento, req.params.siape, function(err, rows) {
            if (err) {
                throw err;
                res.json(err);
            } else {
                res.json({
                    result: encrypt(rows)
                });
            }
        });
    });
    //--------------------------Dias de Ocorrecias por  pessoa -----------------------------------------------------------------
    router.get('/diasOcorrencias/:mes/:ano/:departamento/:siape/:ocorrencia', function(req, res) {
        pontodb.diasOcorrencias(req.params.mes, req.params.ano, req.params.departamento, req.params.siape, req.params.ocorrencia, function(err, rows) {
            if (err) {
                throw err;
                res.json(err);
            } else {
                res.json({
                    result: encrypt(rows)
                });
            }
        });
    });
    //--------------------------Verifica se o Servidor é estudante--------------------------------------------------------------
    router.get('/estudanteBool/:siape/:pergunta_id', function(req, res) {
        pontodb.estudanteBool(req.params.siape, req.params.pergunta_id, function(err, rows) {
            if (err) {
                throw err;
                res.json(err);
            } else {
                /* res.json(rows);*/
                res.json({
                    result: encrypt(rows)
                });
            }
        });
    });

    //--------------------------Verifica se o Servidor é estudante--------------------------------------------------------------
    router.get('/funcionariosListAll/', function(req, res) {
        pontodb.funcionariosListAll(function(err, rows) {
            if (err) {
                throw err;
                res.json(err);
            } else {
                /* res.json(rows);*/
                res.json({
                    result: encrypt(rows)
                });
            }
        });
    });
    //----------------------Tratamento de Erros----------------------------------------------------------------------------------------------------
    d.run(function() {
        app.use('/api', router);
        pontodb.connect(function(err) {
            if (err) {
                console.log("não conectado");
                throw err;
                //   return console.error('Error connecting do database: ' + err.message);
            }
            app.listen(config.api.port, config.api.host);
            console.log('Listening on', config.api.host + ':' + config.api.port);
        });
    });
    d.on('error', function(err) {
        console.error('CAPTURA :', err);
        if (err) {
            console.log('Error ----------------------------------------------------------');
            process.exit();
        };
    });
