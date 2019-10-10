// Built-in Node.js modules
var fs = require('fs')
var path = require('path')

// NPM modules
var express = require('express')
var sqlite3 = require('sqlite3')


var public_dir = path.join(__dirname, 'public');
var template_dir = path.join(__dirname, 'templates');
var db_filename = path.join(__dirname, 'db', 'usenergy.sqlite3');

var app = express();
var port = 8000;

// open usenergy.sqlite3 database
var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
		Testsql();
    }
});

function Testsql(){
	var d = db.all("SELECT * FROM Consumption WHERE year = ?",[2017],function(err, rows) {
        //rows.forEach(function (row) {
            //console.log(rows[50]);
        //})
	});	
	//console.log(d);
}

app.use(express.static(public_dir));


// GET request handler for '/'
app.get('/', (req, res) => {
    ReadFile(path.join(template_dir, 'index.html')).then((template) => {
        let response = template;
		var coal = 0;
		var gas= 0;
		var nuclear= 0;
		var petroleum= 0; 
		var renewable= 0;
		var table_data = "";
		db.all("SELECT * FROM Consumption WHERE year = ?",[2017],function(err, rows) {
			var count = 0;
			while(rows.length>count){
				coal = coal+rows[count].coal;
				gas = gas + rows[count].natural_gas;
				nuclear = nuclear+ rows[count].nuclear;
				petroleum = petroleum+rows[count].petroleum;
				renewable = renewable+ rows[count].renewable;
				table_data = table_data+"<tr><td>"+rows[count].state_abbreviation+"</td>\n"+"<td>"+rows[count].coal+"</td>\n"+"<td>"+rows[count].natural_gas+"</td>\n"+"</td>\n"+"<td>"+rows[count].nuclear+"</td>\n"+"<td>"+rows[count].petroleum+"</td>\n"+"<td>"+rows[count].renewable+"</td></tr>"+"\n";
				
				count = count+1;
			}
			response = response.replace("coal_count","coal_count="+coal);
			response = response.replace("natural_gas_count","natural_gas_count="+gas);
			response = response.replace("nuclear_count","nuclear_count="+nuclear);
			response = response.replace("petroleum_count","petroleum_count="+petroleum);
			response = response.replace("renewable_count","renewable_count="+renewable);
			response = response.replace("<!-- Data to be inserted here -->",table_data)
			WriteHtml(res, response);
			}).catch((err) => {
				Write404Error(res);
			});	
		});	
		

});

// GET request handler for '/year/*'
app.get('/year/:selected_year', (req, res) => {
    ReadFile(path.join(template_dir, 'year.html')).then((template) => {
        let response = template;
        // modify `response` here
		//1. 改变html里title US Energy Consumption 的年份
		//2. 从req.params.selected_year 获得相应的年份
		//3. National Snapshot增加年份
		//4. 通过 prev （先用if statement 去判断是否为1960. 如果是则不变， 如果不是则x-1 然后跳转至/year/x-1 网址）
		//		  next  （先用if statement 去判断是否为2017. 如果是则不变， 如果不是则x+1 然后跳转至/year/x+1 网址）
		//5. 查找x年的五种消耗品的百分比， 然后template.replac（index。html【67-71行】， 从database里获取的数据 ）
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/state/*'
app.get('/state/:selected_state', (req, res) => {
    ReadFile(path.join(template_dir, 'state.html')).then((template) => {
        let response = template;
        // modify `response` here
		/*
			1 改变html里title US Energy Consumption 的年份
			  从req.params.selected_state 获得相应的州
			2 从database里获取的数据存到相对应的每个州的消耗数量里
			3 
		
		
		*/
		
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/energy-type/*'
app.get('/energy-type/:selected_energy_type', (req, res) => {
    ReadFile(path.join(template_dir, 'energy.html')).then((template) => {
        let response = template;
        // modify `response` here

        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

function ReadFile(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data.toString());
            }
        });
    });
}

function Write404Error(res) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('Error: file not found');
    res.end();
}

function WriteHtml(res, html) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(html);
    res.end();
}


var server = app.listen(port);

