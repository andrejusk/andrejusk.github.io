.PHONY: all
all: app site


app: app/node_modules
	# elm

app/node_modules: app/package.json
	yarn --cwd app


site: site/node_modules site/assets
	hugo -s site

site/node_modules: site/package.json
	yarn --cwd site

ASSETS_DIR := site/assets/vendor
site/assets: site/node_modules

	mkdir -p ${ASSETS_DIR}/js
	cp site/node_modules/jquery/dist/jquery.min.js $(ASSETS_DIR)/js
	cp site/node_modules/popper.js/dist/umd/popper.min.js $(ASSETS_DIR)/js
	cp site/node_modules/bootstrap/dist/js/bootstrap.min.js $(ASSETS_DIR)/js
	
	mkdir -p ${ASSETS_DIR}/scss
	cp -R site/node_modules/bootstrap/scss/. ${ASSETS_DIR}/scss/


.PHONY: clean
clean:
	rm -rf public app/node_modules site/node_modules ${ASSETS_DIR} || yes
