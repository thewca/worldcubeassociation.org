.PHONY: run
run:
	docker-compose up

.PHONY: build
build:
	docker-compose build

.PHONY: shell
shell:
	docker-compose exec web bash

.PHONY: clean
clean:
	docker-compose down --volumes --rmi local
