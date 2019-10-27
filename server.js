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
			response = response.replace("<!-- Data to be inserted here -->",table_data);
			WriteHtml(res, response);
			});
		}).catch((err) => {
				Write404Error(res);
			});	
		

});

// GET request handler for '/year/*'
app.get('/year/:selected_year', (req, res) => {
    ReadFile(path.join(template_dir, 'year.html')).then((template) => {
		var year = req.params.selected_year;
		var coal = 0;
		var gas= 0;
		var nuclear= 0;
		var petroleum= 0; 
		var renewable= 0;
		var table_data = "";
		let response = template;
		if(parseInt(year)>2017 || parseInt(year)<1960){
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.write('Error: no data for year greater than 2017 or earilier than 1960');
			res.end();
		}else{
			db.all("SELECT * FROM Consumption WHERE year = ?",[year],function(err, rows) {
				var count = 0;
				while(rows.length>count){
					coal = coal+rows[count].coal;
					gas = gas + rows[count].natural_gas;
					nuclear = nuclear+ rows[count].nuclear;
					petroleum = petroleum+rows[count].petroleum;
					renewable = renewable+ rows[count].renewable;
					var total = rows[count].coal+ rows[count].natural_gas+ rows[count].nuclear+rows[count].petroleum+ rows[count].renewable;
					table_data = table_data+"<tr><td>"+rows[count].state_abbreviation+"</td>\n"+"<td>"+rows[count].coal+"</td>\n"+"<td>"+rows[count].natural_gas+"</td>\n"+"</td>\n"+"<td>"+rows[count].nuclear+"</td>\n"+"<td>"+rows[count].petroleum+"</td>\n"+"<td>"+rows[count].renewable+"</td>\n"+"<td>"+total+"</td></tr>"+"\n";
					
					count = count+1;
				}
				
				response = response.replace("US Energy Consumption",year+" US Energy Consumption");
				response = response.replace("var year","var year="+year);
				response = response.replace("coal_count","coal_count="+coal);
				response = response.replace("natural_gas_count","natural_gas_count="+gas);
				response = response.replace("nuclear_count","nuclear_count="+nuclear);
				response = response.replace("petroleum_count","petroleum_count="+petroleum);
				response = response.replace("renewable_count","renewable_count="+renewable);
				response = response.replace("<!-- Data to be inserted here -->",table_data);
				response = response.replace("National Snapshot",year+" National Snapshot");
				if(year == 1960){
					response = response.replace('<a class="prev_next" href="">Prev</a> <!-- link to itself if year is 1960 -->' , "<a class='prev_next' href='http://localhost:8000/year/1960'>Prev</a> ");
					response = response.replace('<a class="prev_next" href="">Next</a> <!-- link to itself if year is 2017 -->' , "<a class='prev_next' href='http://localhost:8000/year/"+(parseInt(year)+1)+"'>Next</a> ");
				}else if(year == 2017){

					response = response.replace('<a class="prev_next" href="">Prev</a> <!-- link to itself if year is 1960 -->' , "<a class='prev_next' href='http://localhost:8000/year/"+(parseInt(year)-1)+"'>Prev</a> ");
					response = response.replace('<a class="prev_next" href="">Next</a> <!-- link to itself if year is 2017 -->',"<a class='prev_next' href='http://localhost:8000/year/2017'>Next</a> ");
				}else{
					response = response.replace('<a class="prev_next" href="">Prev</a> <!-- link to itself if year is 1960 -->',"<a class='prev_next' href='http://localhost:8000/year/"+(parseInt(year)-1)+"'>Prev</a> ");
					response = response.replace('<a class="prev_next" href="">Next</a> <!-- link to itself if year is 2017 -->',"<a class='prev_next' href='http://localhost:8000/year/"+(parseInt(year)+1)+"'>Next</a> ");				
				}


				WriteHtml(res, response);
				})
		}
	}).catch((err) => {
					Write404Error(res);
				});

});

// GET request handler for '/state/*'
app.get('/state/:selected_state', (req, res) => {
    ReadFile(path.join(template_dir, 'state.html')).then((template) => {
        let response = template;
        // modify `response` here
		var state = req.params.selected_state;
		db.all("SELECT * FROM States ",(err,names)=>{
			//var stateName = names[0].state_name;
			var count_a = 0;
			var name;
			var mark;//store the number that which index is equal to state
			while(names.length>count_a){
				if(names[count_a].state_abbreviation == state){
					name = names[count_a].state_name;
					mark = count_a;
				}
				
				count_a +=1;
			}
			
			db.all("SELECT * FROM Consumption WHERE state_abbreviation = ?",[state],function(err,rows){
				var check = 0;
				for (var i = 0; i<51;i++){
					if(names[i].state_abbreviation == state){
						check = check+1;
					}else{
						check = check;
					}
				}
				if(check == 0){
					res.writeHead(404, {'Content-Type': 'text/plain'});
					res.write('Error: no data for state ' + state + '. only available the 51 US states as abbriviation');
					res.end();					
				}else {
					var coal = new Array(rows.length);
					var gas= new Array(rows.length);
					var nuclear= new Array(rows.length);
					var petroleum= new Array(rows.length); 
					var renewable= new Array(rows.length);
					var count = 0;
					var table="";

					response = response.replace("var state",'var state ="'+name+'"');
					while(rows.length>count){
						coal[count] = rows[count].coal;
						gas[count] = rows[count].natural_gas;
						nuclear[count] = rows[count].nuclear;
						petroleum[count] = rows[count].petroleum;
						renewable[count] = rows[count].renewable;
						var total = rows[count].coal+ rows[count].natural_gas+ rows[count].nuclear+rows[count].petroleum+ rows[count].renewable;
						table = table+"<tr><td>"+rows[count].year+"</td>\n"+"<td>"+rows[count].coal+"</td>\n"+"<td>"+rows[count].natural_gas+"</td>\n"+"</td>\n"+"<td>"+rows[count].nuclear+"</td>\n"+"<td>"+rows[count].petroleum+"</td>\n"+"<td>"+rows[count].renewable+"</td>\n"+"<td>"+total+"</td></tr>"+"\n";
			
						count = count+1;
					}
					response = response.replace("US Energy Consumption",state+" Energy Consumption");
					response = response.replace("coal_counts","coal_counts= ["+coal+" ]");
					response = response.replace("natural_gas_counts","natural_gas_counts=[ "+gas+" ]");
					response = response.replace("nuclear_counts","nuclear_counts=[ "+nuclear+" ]");
					response = response.replace("petroleum_counts","petroleum_counts=[ "+petroleum+" ]");
					response = response.replace("renewable_counts","renewable_counts=[ "+renewable+" ]");
					response = response.replace("Yearly Snapshot", name+" Yearly Snapshot");
					response = response.replace("<!-- Data to be inserted here -->",table);
					response = response.replace('<img src="/images/noimage.jpg" alt="No Image" width="250" height="auto" />', '<img src="/images/'+state+'.png" alt="'+name+' flag'+'" width="250" height="auto" />');
					if(state == "AK"){
						response = response.replace('<a class="prev_next" href="">XX</a>' , '<a class="prev_next" href="http://localhost:8000/state/WY">Prev WY</a>');
						response = response.replace('<a class="prev_next" href="">XX</a>' , '<a class="prev_next" href="http://localhost:8000/state/'+names[mark+1].state_abbreviation+'">Next '+names[mark+1].state_abbreviation+'</a>');	
					}else if(state == "WY"){
						response = response.replace('<a class="prev_next" href="">XX</a>' , '<a class="prev_next" href="http://localhost:8000/state/'+names[mark-1].state_abbreviation+'">Prev '+names[mark-1].state_abbreviation+'</a>');
						response = response.replace('<a class="prev_next" href="">XX</a>' , '<a class="prev_next" href="http://localhost:8000/state/AK">Next AK</a>');
					}else{
						response = response.replace('<a class="prev_next" href="">XX</a>' , '<a class="prev_next" href="http://localhost:8000/state/'+names[mark-1].state_abbreviation+'">Prev '+names[mark-1].state_abbreviation+'</a>');
						response = response.replace('<a class="prev_next" href="">XX</a>' , '<a class="prev_next" href="http://localhost:8000/state/'+names[mark+1].state_abbreviation+'">Next '+names[mark+1].state_abbreviation+'</a>');			
					}
						
					WriteHtml(res, response);
				}
				});		
		})
	}).catch((err)=>{
			Write404Error();
		});
});

// GET request handler for '/energy-type/*'
app.get('/energy-type/:selected_energy_type', (req, res) => {
    ReadFile(path.join(template_dir, 'energy.html')).then((template) => {
        let response = template;
        // modify `response` here
		var energy = req.params.selected_energy_type;
		if(energy == "coal" || energy == "natural_gas" || energy == "nuclear" || energy == "petroleum" || energy == "renewable"){
			db.all("SELECT " +energy+", state_abbreviation FROM Consumption ORDER BY state_abbreviation",(err,rows)=>{
				var energy_count = new Array(51);
				
				var count = 0;		
				var index = 0;
				
				while (51>count){
					var i = 0;
					var name;
					energy_count[count] = new Array(2);
					var state_energy = new Array(rows.length/51);
					while((rows.length/51)>i && rows.length>index){
						name = rows[index].state_abbreviation;
						state_energy[i] = rows[index][energy];
						i = i+1;
						index = index+1;
					}
					energy_count[count][0] = name;
					energy_count[count][1] = state_energy; 
					count = count+1;
				}
				var answer = "";
				answer = answer+"{ "+energy_count[0][0]+": ["+energy_count[0][1]+" ] ";
				var j = 1;
				while(51>j){
					
					answer = answer+", "+energy_count[j][0]+": ["+energy_count[j][1]+" ] ";
					
					j = j+1;
				}
				answer = answer+" }";
				var mark_B;
				var energy_name = ["coal","natural_gas","nuclear","petroleum","renewable"];
				for (var i = 0; i<5;i++){
					if (energy == energy_name[i]){
						mark_B = i;
					}
				}
				if(energy == "coal"){
					response = response.replace('<a class="prev_next" href="">XX</a>' , '<a class="prev_next" href="http://localhost:8000/energy-type/renewable">Prev renewable</a>');
					response = response.replace('<a class="prev_next" href="">XX</a>' , '<a class="prev_next" href="http://localhost:8000/energy-type/'+energy_name[mark_B+1]+'">Next '+energy_name[mark_B+1]+'</a>');	
				}else if(energy == "renewable"){
					response = response.replace('<a class="prev_next" href="">XX</a>' , '<a class="prev_next" href="http://localhost:8000/energy-type/'+energy_name[mark_B-1]+'">Prev '+energy_name[mark_B-1]+'</a>');
					response = response.replace('<a class="prev_next" href="">XX</a>' , '<a class="prev_next" href="http://localhost:8000/energy-type/coal">Next coal</a>');
				}else{
					response = response.replace('<a class="prev_next" href="">XX</a>' , '<a class="prev_next" href="http://localhost:8000/energy-type/'+energy_name[mark_B-1]+'">Prev '+energy_name[mark_B-1]+'</a>');
					response = response.replace('<a class="prev_next" href="">XX</a>' , '<a class="prev_next" href="http://localhost:8000/energy-type/'+energy_name[mark_B+1]+'">Next '+energy_name[mark_B+1]+'</a>');			
				}	

				var table = "";
				var year = 1960;
				for(var i =0; i<(rows.length/51); i++){
					var total =0;
					table = table+"<tr><td>"+(year+i)+"</td>\n";
					for(var j = 0; j<51; j++){
						total = total+energy_count[j][1][i];
						table = table+"<td>"+energy_count[j][1][i] +"</td>\n" ; 
					}
					table = table+ "<td>"+total+"</td></tr>\n";
				}
				response = response.replace('<img src="/images/noimage.jpg" alt="No Image" width="250" height="auto" />', '<img src="/images/'+energy+'.jpg" alt="'+energy+'" width="250" height="auto" />');
				response = response.replace("US Energy Consumption","US "+energy[0].toUpperCase()+energy.substring(1,energy.length)+" Consumption");
				response = response.replace("<!-- Data to be inserted here -->",table);
				response = response.replace("var energy_type",'var energy_type="'+energy+'"');
				response = response.replace("var energy_counts","var energy_counts= "+answer);
				response = response.replace("Consumption Snapshot", energy+" Consumption Snapshot");			
					
			WriteHtml(res, response);
			});
		}else{
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.write('Error: no data for '+energy);
			res.end();			

		}	
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
