install: deps/McLabCore.jar
	npm install

deps:
	mkdir -p deps

deps/McLabCore.jar: deps deps/McLabCore.jar
	cd deps && wget https://github.com/Sable/mcvm.js/releases/download/0.1/McLabCore.jar
