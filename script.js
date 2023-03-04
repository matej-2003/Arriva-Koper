class RouteElement {
	constructor(bus, start, end, stations = []) {
		[this.start_station, this.start_time] = start;
		[this.end_station, this.end_time] = end;
		this.stations = stations;

		this.html = $(`<div></div>`).addClass("card");
		this.bus = $(`<span>${bus}</span>`).addClass("card-subtitle text-muted");
		this.departure_station = $(`<span><b>(${this.start_time})</b> ${this.start_station} </span>`).addClass("card-title station-span");
		this.destination_station = $(`<span><b>(${this.end_time})</b> ${this.end_station} </span>`).addClass("card-title station-span");
		this.expand_btn = $(`<button><b>+</b></button>`).addClass("btn btn-sm btn-outline-primary");
		this.station_list = $(`<ul></ul>`);

		this.departure_station.append(this.expand_btn);
		this.html.append(
			$("<div></div>").addClass("card-body").append(
				this.bus,
				this.departure_station,
				this.station_list,
				this.destination_station,
			)
		);

		for (let [station, time] of this.stations) {
			let li = $("<li></li>");
			// li.html(`${time}: <small>[23]</small> <b>${station}</b>`);
			li.html(`<b>(${time}) </b>${station}`);
			this.station_list.append(li);
		}
		this.station_list.hide();
		this.expand_btn.click(() => this.toggle_expansion());

		let now = new Date();
		let d = new Date(Date.parse(`${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${this.start_time}`));
		if (now > d) {
			this.html.addClass("bg-past");
		}
	}

	toggle_expansion() {
		if (this.expand_btn.text() == '+') {
			this.expand_btn.html('<b>-</b>');
			this.expand_btn.removeClass("btn-outline-primary");
			this.expand_btn.addClass("btn-primary");
			this.station_list.show();
		} else {
			this.expand_btn.html('<b>+</b>');
			this.station_list.hide();
			this.expand_btn.addClass("btn-outline-primary");
			this.expand_btn.removeClass("btn-primary");
		}
	}
}

let data = [];

// $.get("./data/linija_2a1.csv", function(CSVdata) {
// 	let csv_data = CSVdata.trim().split("\n");
// 	let array_data = [];
// 	for (let row of csv_data) {
// 		let line = row.split(",").map(x => x.replace("\\", "").replace("\"", "").replace("\"", ""));
// 		array_data.push(line);
// 	}

// 	let stations = [];
// 	for (let row of array_data) {
// 		stations.push(row[0]);
// 	}

// 	let al = array_data[0].length;
// 	for (let line=1; line<al; line++) {
// 		let bus_schedule = [];
// 		for (let i=0; i<stations.length; i++) {
// 			bus_schedule.push([stations[i], array_data[i][line]]);
// 		}
// 		data.push({
// 			"bus": "2A Ospedale",
// 			"schedule_data": bus_schedule
// 		});
// 	}
// });

function load_schedule() {
	fetch('./data/data.json')
		.then((response) => response.json())
		.then((data) => {
			for (let bus_connection of data) {
				let { name, file } = bus_connection;
				load_bus_connection(file, name);
			}
		});
}

load_schedule();

function load_bus_connection(file, name) {
	$.get(file, function (CSVdata) {
		let rows = CSVdata.trim().split("\n");
		let csv = [];
		for (let row of rows) {
			let cols = row.split(",");
			for (let i=0; i<cols.length; i++) {
				cols[i] = cols[i].trim();
			}
			csv.push(cols);
		}


		let stations = [];
		for (let row of csv) {
			stations.push(row[0].trim());
		}

		let al = csv[0].length;
		for (let line = 1; line < al; line++) {
			let bus_schedule = [];
			for (let i = 0; i < stations.length; i++) {
				bus_schedule.push([stations[i], csv[i][line]]);
			}
			data.push({
				"bus": name,
				"schedule_data": bus_schedule
			});
		}
	});
}

let schedule = $('.schedule');
let switch_btn = $('#switch');
let od_input = $("#od");
let do_input = $("#do");
let date_ = document.querySelector("#date");
let date = $(date_);
let find_btn = $("#find");

date_.valueAsDate = new Date();
let search_params = new URLSearchParams(window.location.search);

if (search_params.has('od')) {
	od_input.val(search_params.get('od'));
}

if (search_params.has('do')) {
	do_input.val(search_params.get('do'));
}

function new_url() {
	search_params.set('od', od_input.val());
	search_params.set('do', do_input.val());
	// window.history.pushState({page: "another"}, "another page", window.location.href + "?" + search_params.toString());
}

find_btn.click(() => {
	let od_station = od_input.val();
	let do_station = do_input.val();

	schedule.html('');
	for (let route_data of data) {
		find_route(od_station, do_station, route_data);
	}

	if (schedule.html() == '') {
		schedule.html(
			`<div class="alert alert-warning" role="alert">
				Prometna povezava ne obstaja!!
			</div>`);
	}
	new_url();
});

switch_btn.click(() => {
	let od_station = od_input.val();
	od_input.val(do_input.val());
	do_input.val(od_station);
	new_url();
});

function find_route(od_station, do_station, route_data) {
	let bus = route_data['bus'];
	let schedule_data = route_data['schedule_data'];
	let result_status = 0;
	let od_time = "";
	let do_time = "";

	for (let [station, time] of schedule_data) {
		if (!result_status && station == od_station) {
			result_status = 1;
			od_time = time;
		}
		if (result_status && station == do_station) {
			result_status = 2;
			od_time = time;
		}

	}

	let travel_status = 0;
	let start, end;
	let stations = [];

	if (result_status == 2) {
		for (let [station, time] of schedule_data) {
			if (!time) continue;
			if (travel_status == 1) {
				stations.push([station, time]);
			}
			if (travel_status == 0 && station == od_station) {
				travel_status = 1;
				start = [station, time];
			}
			if (travel_status == 1 && station == do_station) {
				travel_status = 2;
				end = [station, time];
				stations.pop();
				break;
			}
		}
	}

	if (travel_status == 2) {
		let re = new RouteElement(bus, start, end, stations);
		schedule.append(re.html);
	}
}