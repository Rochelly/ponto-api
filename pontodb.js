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

module.exports = {
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

	console.log(sql);
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

	//console.log(servidor);

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
