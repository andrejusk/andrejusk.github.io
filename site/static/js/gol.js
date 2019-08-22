/* 
    Game Of Life
    A PEN BY Edditoria 愛迪        
    https://codepen.io/Edditoria/pen/usFxj
*/
(function() {
    // Format for cell and @world:
    // cell = { row: num, column: num, status: true/false }
    // @world = [[cell, cell...], [cell, cell...]...]
    // To call a cell: @world[roll_num][column_num]
    var GameOfLife, gol;

    GameOfLife = function() {
        class GameOfLife {
            constructor() {
                this.samsara = this.samsara.bind(this);
            }

            create(option = {}, value) {
                var key;
                if (typeof option === 'string' && value !== void 0) {
                    this[option] = value;
                } else {
                    for (key in option) {
                        value = option[key];
                        this[key] = value;
                    }
                }
                this.world = this.create_world();
                this.samsara();
            }


            // ------- Initiate The World ------- #

            // callback function to do something on each cell
            travel_world(callback) {
                var column, i, ref, results, row;
                results = [];
                for (row = i = 0, ref = this.roll_num; 0 <= ref ? i < ref : i > ref; row = 0 <= ref ? ++i : --i) {
                    results.push(function() {
                        var j, ref1, results1;
                        results1 = [];
                        for (column = j = 0, ref1 = this.column_num; 0 <= ref1 ? j < ref1 : j > ref1; column = 0 <= ref1 ? ++j : --j) {
                            results1.push(callback.call(this, {
                                row: row,
                                column: column
                            }));

                        }
                        return results1;
                    }.call(this));
                }
                return results;
            }

            create_world() {
                this.draw_world();
                // for every cell, decide that cell being alive depends on chance of born_prob
                return this.travel_world(cell => {
                    cell.status = Math.random() < this.born_prob;
                    return cell;
                });
            }

            draw_world() {
                this.canvas = document.createElement('canvas');
                this.canvas.width = this.cell_size * this.column_num;
                this.canvas.height = this.cell_size * this.roll_num;
                document.getElementById(this.dom_id).appendChild(this.canvas);
                return this.canvas_context = this.canvas.getContext('2d');
            }


            // ------- Methods to Create Life ------- #
            draw(cell) {
                var coords;
                coords = [cell.row * this.cell_size, cell.column * this.cell_size, this.cell_size, this.cell_size];
                this.canvas_context.strokeStyle = this.grid_color;
                this.canvas_context.strokeRect.apply(this.canvas_context, coords);
                this.canvas_context.fillStyle = cell.status ? this.alive_color : this.dead_color;
                return this.canvas_context.fillRect.apply(this.canvas_context, coords);
            }

            samsara() {
                // game loop forever
                this.world = this.travel_world(cell => {
                    cell = this.world[cell.row][cell.column];
                    this.draw(cell);
                    return this.dead_or_alive(cell);
                });
                return setTimeout(this.samsara, this.draw_rate); // comment this out for 1 round only
            }


            // ------- Logic and Patterns of Life ------- #

            // make decision for next step, return the whole cell
            dead_or_alive(cell) {
                var neighbor;
                neighbor = this.count_neighbor(cell);
                cell = this.review_status(cell, neighbor);
                return cell;
            }

            count_neighbor(cell) {
                var column, i, j, neighbor, neighbor_column, neighbor_row, row;
                neighbor = 0;
                for (row = i = -1; i <= 1; row = ++i) {
                    for (column = j = -1; j <= 1; column = ++j) {
                        neighbor_row = cell.row + row;
                        neighbor_column = cell.column + column;
                        if ((row || column) && this.is_alive(neighbor_row, neighbor_column)) {
                            // (row or column) means except itself
                            ++neighbor;
                        }
                    }
                }
                return neighbor;
            }


            // check if that cell is alive (true/false)
            is_alive(row, column) {
                var result;
                // check if coordinates is inside the boundary
                if (this.world[row] !== void 0 && this.world[row][column] !== void 0) {
                    // check the current status of the neighbor
                    result = this.world[row][column].status;
                } else {
                    result = false; // if coordinates is undefined
                }
                return result;
            }


            // game rules
            review_status(cell, neighbor) {
                // input cell and num of neighbor, return the whole cell

                // if cell is alive
                //   if neighbor < 2 then die <-- under-population!
                //   if neighbor is 2 or 3 then alive
                //   if neighbor > 3 then die <-- overcrowding!
                // if cell is dead and neighbor is 3 then live <-- reproduction!

                // copy the cell object first
                cell = {
                    row: cell.row,
                    column: cell.column,
                    status: cell.status
                };

                if (neighbor < 2 || neighbor > 3) {
                    cell.status = false;
                } else if (neighbor === 3) {
                    cell.status = true;
                }
                // all others remain the same status
                return cell;
            }
        }

        ;

        // default settings
        GameOfLife.prototype.dom_id = 'game-of-life';

        GameOfLife.prototype.roll_num = 25; // num of cell

        GameOfLife.prototype.column_num = 25; // num of cell

        GameOfLife.prototype.cell_size = 12; // in px, canvas_width = @cell_size * @column_num

        GameOfLife.prototype.draw_rate = 100; // in milliseconds

        GameOfLife.prototype.born_prob = 0.5; // probability for a life to born

        GameOfLife.prototype.alive_color = '#42a5f5';

        GameOfLife.prototype.dead_color = '#121212';

        GameOfLife.prototype.grid_color = 'rgba(255, 255, 255, 0.2)';

        return GameOfLife;

    }.call(this);


    // implement GOL
    gol = new GameOfLife();

    gol.create();

}).call(this);

//# sourceURL=coffeescript