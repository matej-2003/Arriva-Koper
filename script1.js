class RouteElement {
	constructor(bus, start, end, stations=[]) {
		[this.start_station, this.start_time] = start;
		[this.end_station, this.end_time] = end;
		this.stations = stations;

		this.html = $("<div></div>").addClass("drive");
		this.expand_button = $("<button>+</button>");

		let span_bus = $("<span></span>");
		span_bus.html(`<b>${bus}</b> `);

		let span_start = $("<span></span>");
		span_start.html(`(${this.start_time}) <b>${this.start_station}</b> `);
		span_start.append(this.expand_button);

		let span_end = $("<span></span>");
		span_end.html(`(${this.end_time}) <b>${this.end_station}</b>`);

		this.station_list = $("<ul></ul>");
		for (let [station, time] of this.stations) {
			let li = $("<li></li>");
			li.html(`(${time}) <b>${station}</b>`);
			this.station_list.append(li);
		}
		this.station_list.hide();

		this.html.append(
			span_bus,
			span_start,
			this.station_list,
			span_end
		);

		this.expand_button.click(() => this.toggle_expansion());
	}

	toggle_expansion() {
		console.log("expand");
		if (this.expand_button.html() == '+') {
			this.expand_button.html('-');
			this.station_list.show();
		} else {
			this.expand_button.html('+');
			this.station_list.hide();
		}
	}
}


$.get("./linija_2a1.csv", function(CSVdata) {
	let data = CSVdata.split("\n");
	let array_data = [];
	for (let row of data) {
		let line = row.split(",").map(x => x.replace("\\", "").replace("\"", "").replace("\"", ""));
		array_data.push(line);
	}
	console.log(array_data);
});
let data = [];

function load_schedule() {
	fetch('./data.json')
		.then((response) => response.json())
		.then((json) => data = json);
}

load_schedule();

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
		schedule.html('<b>Ni najdenih poti!</b>');
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
			if (travel_status == 1) {
				console.log(station, "->", time);
				stations.push([station, time]);
			}
			if (travel_status == 0 && station == od_station) {
				travel_status = 1;
				console.log("START");
				start = [station, time];
			}
			if (travel_status == 1 && station == do_station) {
				travel_status = 2;
				console.log("END");
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