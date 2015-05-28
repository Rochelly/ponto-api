var tedious = require('tedious');

Date.prototype.format = function () {
	return [String('0' + this.getUTCDate()).slice(-2),
	String('0' + (this.getUTCMonth() + 1)).slice(-2),
	this.getUTCFullYear()].join('/');
}

var config = require('./config.js');

var conn = null;

function mssql_weekday_from_str(date) {
	date = "CONVERT(smalldatetime, " + date + " + ' 00:00', 103)";
	var str = "DATEPART(weekday, " + date + ")";

	return str;
}

function mssql_date_get_time(col) {
	var days = "DATEDIFF(day, CAST('00:00' as smalldatetime), " + col + ") * 24" ;
	var hours = "DATEPART(hour, " + col + ")";
	var mins = "DATEPART(minute, " + col + ")";

	var str = "CAST(" + days + "+" + hours + " as nvarchar(4)) + ':' + CASE WHEN " + mins + " < 10 THEN '0' + CAST(" + mins + " as nvarchar(2)) ELSE CAST(" + mins + " as nvarchar(2)) END";

	return str;
}

function mssql_min_to_time(field) {
    //console.log('mssql min to time:', field);
    var date_pos = "DATEADD(minute, " + field  + ", CAST('00:00' as smalldatetime))";
    var date_neg = "DATEADD(minute, " + field + " * -1, CAST('00:00' as smalldatetime))"
    
    var str = "CASE WHEN " + field  + " < 0 THEN '-' + " + mssql_date_get_time(date_neg) + " ELSE " + mssql_date_get_time(date_pos) + " END";
    return str;
}

function mssql_min_to_time2(min) {
	var date = "DATEADD(minute, " + min + ", CAST('00:00' as smalldatetime))";
	var days = "DATEDIFF(day, CAST('00:00' as smalldatetime), " + date + ") * 24" ;
	var hours = "DATEPART(hour, " + date + ")";
	var mins = "DATEPART(minute, " + date + ")";

	var str = "CAST(" + days + "+" + hours + " as nvarchar(4)) + ':' + CASE WHEN " + mins + " < 10 THEN '0' + CAST(" + mins + " as nvarchar(2)) ELSE CAST(" + mins + " as nvarchar(2)) END";

	return str;
}

module.exports = 
{
	connect: function (callback) {
		conn = new tedious.Connection(config.db);

		conn.on('connect', function (err) {
			if (err) return callback(err);
			callback(null);
		});

	// conn.on('debug', function(msg) {
	//     console.log('[DEBUG]', msg)
	// });
},

disconnect: function () {
	conn.close();
},

query: function (sql, callback) {
	var rows = [];

	req = new tedious.Request(sql, function (err, count) {
		if (err) return callback(err);
		callback(null, rows);
	});

	req.on('row', function (cols) {
		var row = {};
		for (var i = 0; i < cols.length; i++) {
			row[cols[i].metadata.colName] = cols[i].value;
		}

		rows.push(row);
	});

	conn.execSql(req);
},

servidor: function (siape, callback) {
	var rows = [];
	req = new tedious.Request("select f.n_folha as siape, f.nome, d.descricao from funcionarios as f  JOIN departamentos as d on f.departamento_id=d.id  where n_folha = '" + siape + "'", function (err, count) {

	//req = new tedious.Request("select f.n_folha as siape, f.nome from funcionarios as f JOIN where ( n_folha = '" + siape + "')", function (err, count) {
		if (err) return callback(err);

	    //console.log('req finish');
	    callback(null, rows[0]);
	});

	req.on('row', function (cols) {
		var row = {};
		for (var i = 0; i < cols.length; i++) {
			row[cols[i].metadata.colName] = cols[i].value;
		}

		rows.push(row);
	});

	conn.execSql(req);
},

horarios: function (siape, callback) {
	var rows = [];
	var sql ="SELECT  h.dia_semana, h.entrada1, h.saida1, h.entrada2, h.saida2, h.entrada3, h.saida3 from  funcionarios f  INNER JOIN horarios h on f.horario_num = h.numero where f.n_folha ='"+siape+"' and h.folga = 'false'";

	req = new tedious.Request(sql,
		function (err, count) {
			if (err) return callback(err);
	    callback(null, rows);
	});

	req.on('row', function (cols) {
		var row = {};
		for (var i = 0; i < cols.length; i++) {
			row[cols[i].metadata.colName] = cols[i].value;
		}

		rows.push(row);
	});

	conn.execSql(req);
},

chefia: function (usuario, callback) {
	var rows = [];
	var sql ="SELECT u.nome, d.id as departamento_id, d.descricao  FROM usuarios u INNER JOIN usuarios_departamentos ud on u.id = ud.usuario_id INNER JOIN departamentos d on ud.departamento_id = d.id  where u.nome LIKE '%"+usuario+"%' and u.desativado = 'FALSE' and u.bloqueado = 'FALSE'";
	
		req = new tedious.Request(sql,
		function (err, count) {
			if (err) return callback(err);
	    callback(null, rows);
	});

	req.on('row', function (cols) {
		var row = {};
		for (var i = 0; i < cols.length; i++) {
			row[cols[i].metadata.colName] = cols[i].value;
		}

		rows.push(row);
	});

	conn.execSql(req);
},

chefiaDados: function (usuario, callback) {
	var rows = [];
	var sql ="SELECT usuarios_departamentos.usuario_id, usuarios.nome,usuarios_departamentos.departamento_id,departamentos.descricao FROM usuarios INNER JOIN usuarios_departamentos ON usuarios.id = usuarios_departamentos.usuario_id INNER JOIN departamentos ON usuarios_departamentos.departamento_id = departamentos.id where usuarios.nome = '"+usuario+"'";


	req = new tedious.Request(sql, function (err, count) {
		if (err) return callback(err);
		callback(null, rows[0]);
	});

	req.on('row', function (cols) {
		var row = {};
		for (var i = 0; i < cols.length; i++) {
			row[cols[i].metadata.colName] = cols[i].value;
		}
		rows.push(row);
	});


	conn.execSql(req);
},

funcionariosDep: function (Departamento, callback) {
	var rows = [];
	var sql= "SELECT n_folha, nome from funcionarios WHERE departamento_id = '"+Departamento+"' ORDER by nome";
	
	req = new tedious.Request(sql,
		function (err, count) {
			if (err) return callback(err);

	    //console.log('req finish');
	    callback(null, rows);
	});

	req.on('row', function (cols) {
		var row = {};
		for (var i = 0; i < cols.length; i++) {
			row[cols[i].metadata.colName] = cols[i].value;
		}

		rows.push(row);
	});

	conn.execSql(req);
},

departamento: function (dep, mes, ano, callback) {
	var rows = [];

	var str_mes = (mes < 10) ? '0' + mes : mes.toString();
	var days = new Date(ano, mes, 0).getUTCDate();

	var funcs_dep_filtro = "select f.n_folha from funcionarios f join departamentos d on f.departamento_id = d.id where upper(d.descricao) = upper('" + dep + "')";

	var sumario_funcs_dep = "select siape, nome, '01/" + str_mes + "/" + ano + " a " + days + "/" + str_mes + "/" + ano + "' as periodo, " + mssql_min_to_time('SUM(saldo_minutos)') + " as saldo, " + mssql_min_to_time2('SUM(minutos_trabalhados)') + " as horas_trabalhadas, " + mssql_min_to_time2("SUM(CASE WHEN " + mssql_weekday_from_str('bdata') + " > 1 AND " + mssql_weekday_from_str('bdata') + " < 7 THEN carga_horaria_minutos ELSE 0 END)") + " as carga_horaria  from consulta_batidas where siape in (" + funcs_dep_filtro + ") and bdata like '%/" + str_mes + "/" + ano.toString() + "' group by siape, nome";

	var sql = sumario_funcs_dep;

	req = new tedious.Request(sql, function (err, count) {
		if (err) return callback(err);

	    //console.log('req finish');
	    callback(null, rows[0]);
	});

	req.on('row', function (cols) { 
		var row = {};
		for (var i = 0; i < cols.length; i++) {
			row[cols[i].metadata.colName] = cols[i].value;
		}

		rows.push(row);
	});

	conn.execSql(req);
},


terceiraEntrada: function (siape, mes, ano, callback) {
	var rows = [];

	var str_mes = (mes < 10) ? '0' + mes : mes.toString();
	var days = new Date(ano, mes, 0).getUTCDate();
	var sql = "SELECT COUNT(*) as quantidade   FROM funcionarios f INNER JOIN batidas b on f.id = b.funcionario_id where b.entrada3 is not null and f.n_folha = '"+siape+"' and  (b.data between '"+ano+str_mes+"01' and '"+ano+str_mes+days+"' )"

	req = new tedious.Request(sql, function (err, count) {
		if (err) return callback(err);

	    //console.log('req finish');
	    callback(null, rows[0]);
	});

	req.on('row', function (cols) { 
		var row = {};
		for (var i = 0; i < cols.length; i++) {
			row[cols[i].metadata.colName] = cols[i].value;
		}

		rows.push(row);
	});

	conn.execSql(req);
},

ocorrencias: function ( mes, ano,dep,siape,callback) {
	var rows = [];
	var str_mes = (mes < 10) ? '0' + mes : mes.toString();
	var days = new Date(ano, mes, 0).getUTCDate();


	var  sql = "select c2.nome, c2.siape, c2.departamento ,c2.descricao, c2.ocorrencia, COUNT (*) as quantidade from ( SELECT c1.nome, c1.siape, c1.departamento, j.descricao, c1.ocorrencia, c1.data  from (    SELECT    f.departamento_id as departamento,    f.id,    f.n_folha as siape,   f.nome,    b.entrada2,   b.data,   case when entrada1 LIKE '*%' then entrada1 when saida1 LIKE '*%' then saida1 when entrada2 LIKE '*%' then entrada2 when entrada3 LIKE '*%' then entrada3 when saida3 LIKE '*%' then saida3 else null end as ocorrencia   from funcionarios f   INNER JOIN batidas b on f.id = b.funcionario_id   where (b.data between '"+ano+str_mes+"01' and '"+ano+str_mes+days+"' ) and f.departamento_id = "+dep+" and f.n_folha  ='"+siape+"')as c1 JOIN justificativas j on c1.entrada2 = j.nome where not c1.ocorrencia is null ) as c2 GROUP BY c2.nome, c2.siape, c2.departamento ,c2.descricao, c2.ocorrencia ";
	
	req = new tedious.Request(sql,
		function (err, count) {
			if (err) return callback(err);

	    //console.log('req finish');
	    callback(null, rows);
	});

	req.on('row', function (cols) {
		var row = {};
		for (var i = 0; i < cols.length; i++) {
			row[cols[i].metadata.colName] = cols[i].value;
		}

		rows.push(row);
	});

	conn.execSql(req);
},

diasTrabalhados: function ( mes, ano,dep,siape,callback) {
	var rows = [];
	var str_mes = (mes < 10) ? '0' + mes : mes.toString();
	var days = new Date(ano, mes, 0).getUTCDate();
	var  sql = "select c3.siape, SUM (quantidade) as naotrabalhados, ("+days+" - SUM (quantidade)) as trabalhados from ( select c2.siape, COUNT (*) as quantidade from ( SELECT c1.nome, c1.siape, c1.departamento, j.descricao, c1.ocorrencia, c1.data from ( SELECT f.departamento_id as departamento, f.id, f.n_folha as siape, f.nome, b.entrada2, b.data, case when entrada1 LIKE '*%' then entrada1 when saida1 LIKE '*%' then saida1 when entrada2 LIKE '*%' then entrada2 when entrada3 LIKE '*%' then entrada3 when saida3 LIKE '*%' then saida3 else null end as ocorrencia from funcionarios f INNER JOIN batidas b on f.id = b.funcionario_id where (b.data between '"+ano+str_mes+"01' and '"+ano+str_mes+days+"' ) and f.departamento_id = "+dep+" and f.n_folha  ='"+siape+"')as c1 JOIN justificativas j on c1.entrada2 = j.nome where not c1.ocorrencia is null ) as c2 GROUP BY c2.nome, c2.siape, c2.departamento ,c2.descricao, c2.ocorrencia) as c3 GROUP BY c3.siape ";
	
	req = new tedious.Request(sql,
		function (err, count) {
			if (err) return callback(err);
			callback(null, rows);
		});

	req.on('row', function (cols) {
		var row = {};
		for (var i = 0; i < cols.length; i++) {
			row[cols[i].metadata.colName] = cols[i].value;
		}
		rows.push(row);
	});

	conn.execSql(req);
},

diasOcorrencias: function ( mes, ano,dep,siape,ocorrencia,callback) {
	var rows = [];
	var str_mes = (mes < 10) ? '0' + mes : mes.toString();
	var days = new Date(ano, mes, 0).getUTCDate();


	var sql  = "SELECT day(c1.data) as dia   from   (SELECT      f.departamento_id as departamento, f.id, f.n_folha as siape, f.nome, b.entrada2,b.data,case when entrada1 LIKE '*%' then entrada1 when saida1 LIKE '*%' then saida1 when entrada2 LIKE '*%' then entrada2 when entrada3 LIKE '*%' then entrada3 when saida3 LIKE '*%' then saida3 else null end as ocorrencia from funcionarios f INNER JOIN batidas b on f.id = b.funcionario_id where (b.data between '"+ano+str_mes+"01' and '"+ano+str_mes+days+"' ) and f.departamento_id = "+dep+" and f.n_folha  ='"+siape+"')as c1   JOIN justificativas j on c1.entrada2 = j.nome   where not c1.ocorrencia is null and c1.ocorrencia = '"+ocorrencia+"'";

	//var  sql = "select c2.nome, c2.siape, c2.departamento ,c2.descricao, c2.ocorrencia, COUNT (*) as quantidade from ( SELECT c1.nome, c1.siape, c1.departamento, j.descricao, c1.ocorrencia, c1.data  from (    SELECT    f.departamento_id as departamento,    f.id,    f.n_folha as siape,   f.nome,    b.entrada2,   b.data,   case when entrada1 LIKE '*%' then entrada1 when saida1 LIKE '*%' then saida1 when entrada2 LIKE '*%' then entrada2 else null end as ocorrencia   from funcionarios f   INNER JOIN batidas b on f.id = b.funcionario_id   where (b.data between '"+ano+str_mes+"01' and '"+ano+str_mes+days+"' ) and f.departamento_id = "+dep+" and f.n_folha  ='"+siape+"')as c1 JOIN justificativas j on c1.entrada2 = j.nome where not c1.ocorrencia is null ) as c2 GROUP BY c2.nome, c2.siape, c2.departamento ,c2.descricao, c2.ocorrencia ";
	
	req = new tedious.Request(sql,
		function (err, count) {
			if (err) return callback(err);

	    //console.log('req finish');
	    callback(null, rows);
	});

	req.on('row', function (cols) {
		var row = {};
		for (var i = 0; i < cols.length; i++) {
			row[cols[i].metadata.colName] = cols[i].value;
		}

		rows.push(row);
	});

	conn.execSql(req);
},



estudanteBool: function (siape,pergunta_id,callback) {
	var rows = [];
	var sql ="SELECT f.n_folha,fr.resposta  from funcionarios f INNER JOIN funcionarios_respostas fr on f.id = fr.funcionario_id INNER JOIN perguntas_adicionais pa on fr.pergunta_id = pa.id where f.n_folha = '"+siape +"' and  pa.id = '"+pergunta_id+"'";


	req = new tedious.Request(sql, function (err, count) {
		if (err) return callback(err);
		callback(null, rows[0]);
	});

	req.on('row', function (cols) {
		var row = {};
		for (var i = 0; i < cols.length; i++) {
			row[cols[i].metadata.colName] = cols[i].value;
		}
		rows.push(row);
	});


	conn.execSql(req);
},


sumario: function (siape, mes, ano, callback) {
	var str_mes = (mes < 10) ? '0' + mes : mes.toString();

	var workingDays = 0;
	var days = new Date(ano, mes, 0).getUTCDate();
	for (var i = 1; i <= days; i++) {
		var wd = new Date(ano, mes-1, i).getUTCDay();
	    //console.log('dia', i, wd);
	    if (wd != 0 && wd != 6)
	    	workingDays++;
	}

	var sumario_sql = "select siape, nome, '01/" + str_mes + "/" + ano + " a " + days + "/" + str_mes + "/" + ano + "' as periodo, " + mssql_min_to_time('SUM(saldo_minutos)') + " as saldo, " + mssql_min_to_time2('SUM(minutos_trabalhados)') + " as horas_trabalhadas, " + mssql_min_to_time2("SUM(CASE WHEN " + mssql_weekday_from_str('bdata') + " > 1 AND " + mssql_weekday_from_str('bdata') + " < 7 THEN carga_horaria_minutos ELSE 0 END)") + " as carga_horaria from consulta_batidas where siape = '" + siape + "' and bdata like '%/" + str_mes + "/" + ano.toString() + "' group by siape, nome";
	//console.log(sumario_sql);
	
	var rows = [];

	req = new tedious.Request(sumario_sql, function (err, count) {
		if (err) return callback(err);

	    //console.log('req finish');
	    callback(null, rows[0]);
	});

	req.on('row', function (cols) {
		var row = {};
		for (var i = 0; i < cols.length; i++) {
			row[cols[i].metadata.colName] = cols[i].value;
		}

		rows.push(row);
	});

	conn.execSql(req);
},

pontos: function (siape, mes, ano, callback) {
	var rows = [];

	var str_mes = (mes < 10) ? '0' + mes : mes.toString();

	var sql = "select *, " + mssql_min_to_time('minutos_trabalhados') + " as horas_trabalhadas, " + mssql_min_to_time('saldo_minutos') + " as saldo from consulta_batidas where siape = '" + siape + "' and bdata like '%/" + str_mes + "/" + ano.toString() + "'";


	req = new tedious.Request(sql,
		function (err, count) {
			if (err) return callback(err);

	    //console.log('req finish');
	    callback(null, rows);
	});

	req.on('row', function (cols) {
		var row = {};
		for (var i = 0; i < cols.length; i++) {
			row[cols[i].metadata.colName] = cols[i].value;
		}

		rows.push(row);
	});

	conn.execSql(req);
},

feriados: function (mes, ano, callback) {
	var rows = [];

	var str_mes = (mes < 10) ? '0' + mes : mes.toString();

	var sql = "select id, CONVERT(varchar, data, 103) as data, descricao from feriados where CONVERT(varchar, data, 103) like '%/" + str_mes + '/' + ano + "'";

	req = new tedious.Request(sql,
		function (err, count) {
			if (err) return callback(err);

	    //console.log('req finish');
	    callback(null, rows);
	});

	req.on('row', function (cols) {
		var row = {};
		for (var i = 0; i < cols.length; i++) {
			row[cols[i].metadata.colName] = cols[i].value;
		}

		rows.push(row);
	});

	conn.execSql(req);
},

legendas: function (siape, mes, ano, callback) {
	var rows = [];

	var str_mes = (mes < 10) ? '0' + mes : mes.toString();
	var pontos = []
	pontos.push("select distinct substring(bentrada1, 2, LEN(bentrada1)) from consulta_batidas where siape = '" + siape + "' and bdata like '%/" + str_mes + "/" + ano.toString() + "'");
	pontos.push("select distinct substring(bsaida1, 2, len(bsaida1)) from consulta_batidas where siape = '" + siape + "' and bdata like '%/" + str_mes + "/" + ano.toString() + "'");
	pontos.push("select distinct substring(bentrada2, 2, LEN(bentrada2)) from consulta_batidas where siape = '" + siape + "' and bdata like '%/" + str_mes + "/" + ano.toString() + "'");
	pontos.push("select distinct substring(bsaida2, 2, len(bsaida2)) from consulta_batidas where siape = '" + siape + "' and bdata like '%/" + str_mes + "/" + ano.toString() + "'");

	var sql = "select substring(nome, 2, LEN(nome)) as nome, descricao from justificativas where substring(nome, 2, LEN(nome)) in (" + pontos.join(' UNION ') + ")";



	req = new tedious.Request(sql,
		function (err, count) {
			if (err) return callback(err);

			console.log('req finish');
			callback(null, rows);
		});

	req.on('row', function (cols) {
		var row = {};
		for (var i = 0; i < cols.length; i++) {
			row[cols[i].metadata.colName] = cols[i].value;
		}

		rows.push(row);
	});

	conn.execSql(req);
},

ultima_atualizacao: function (callback) {
	var ultima_atualizacao = "select CONVERT(nvarchar(10), ultima_execucao, 103) + ' ' + hora as ultima_atualizacao, id, tarefa, data, hora, resultado_execucao, ultima_execucao, lido from agenda_comunicacao where receber_registros = 'true' and ultima_execucao is not null and resultado_execucao = 'OK' order by ultima_execucao desc, hora desc";

	this.query(ultima_atualizacao, function (err, rows) {
		if (err) return callback(err);
		callback(null, rows[0]);
	});
},

}
