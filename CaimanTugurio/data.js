/* ==========================================================================
   CAIMÁN TUGURIO · Datos del menú
   Fuente: menú oficial (caimantugurio.com) + fotos del menú físico.
   Precios base tomados del sitio oficial — sujetos a cambio en tienda.
   ========================================================================== */

const MENU = {
  info: {
    nombre: "Caimán Tugurio",
    lema: "El bar de los locales · Playa del Carmen desde 2010",
    direccion: "Calle 24 Nte, entre 1ª y 5ª Av., Gonzalo Guerrero, 77710 Playa del Carmen, Q.R.",
    telefono: "+52 984 147 1695",
    whatsapp: "529841471695",
    horario: "Lun a Dom · 9:00 am – 2:00 am",
    musica: "🎸 Música en vivo todas las noches · 6:00 pm y 10:00 pm",
    instagram: "https://www.instagram.com/caimantugurio/",
    facebook: "https://www.facebook.com/caimantugurio5/",
    maps: "https://www.google.com/maps/search/?api=1&query=Caiman+Tugurio+Playa+del+Carmen"
  },

  // ------------------------------------------------------------------ grupos
  grupos: [
    {
      id: "desayunos",
      nombre: "Desayunos",
      icono: "🍳",
      secciones: [
        {
          nombre: "Café y Jugos",
          items: [
            { n: "Americano", p: 25 },
            { n: "Capuccino", p: 35 },
            { n: "Espresso", p: 25 },
            { n: "Espresso doble", p: 50 },
            { n: "Jugos naturales (500 ml)", d: "¡Haz tu combinación! Apio-piña-perejil · Betabel-zanahoria-naranja · Jengibre-manzana-naranja-miel · Yogurt-guayaba-piña · Fresa-guayaba-naranja · Piña-pepino-apio-jengibre · Verde", p: 38 },
            { n: "Jugo de Naranja", p: 35 }
          ]
        },
        {
          nombre: "Toast",
          nota: "Todos a $50",
          items: [
            { n: "Jaguar", d: "Pan integral, mini omelette de espinaca, queso de cabra, alioli de tocino.", p: 50 },
            { n: "Iguana", d: "Pan integral, huevo estrellado, tomate cherry, pesto, aguacate, alioli de tocino.", p: 50 },
            { n: "Sereque", d: "Dip de betabel, aguacate, albahaca, ajonjolí, aceite de oliva.", p: 50 }
          ]
        },
        {
          nombre: "Especialidades Don Caimán",
          items: [
            { n: "Hot Cakes", d: "(3 pz) Tradicionales acompañados de plátano y fresa.", p: 80 },
            { n: "Kaab", d: "(2 pz) Portobellos marinados rellenos de queso, tomate y huevo estrellado.", p: 115 },
            { n: "Croque Caimán", d: "Pan integral, queso, alioli de tocino, espinacas, jitomate, cebolla, jamón, huevo estrellado y papas caimán.", p: 95 },
            { n: "Burrito de Pollo", d: "Pan pita artesanal, pollo 200 g, guacamole, col morada, frijoles, queso y papas caimán.", p: 120 },
            { n: "Burrito a la Mexicana", d: "Pan pita con huevo revuelto a la mexicana, frijoles y papas caimán.", p: 74 }
          ]
        },
        {
          nombre: "Huevos",
          items: [
            { n: "Omelette o Revueltos", d: "Con guarnición de papas y frijoles. 2 ingredientes a escoger: jamón, tocino, queso, cebolla, jitomate, chile serrano, espinacas o champiñones.", p: 70 },
            { n: "Extra ingrediente", p: 15 }
          ]
        },
        {
          nombre: "Los Tradicionales",
          items: [
            { n: "Rancheros", d: "Huevos estrellados sobre tortilla, bañados en salsa roja, con frijoles.", p: 70 },
            { n: "Motuleños", d: "Huevos estrellados sobre tostadas con frijoles, jamón, queso y chícharos.", p: 80 },
            { n: "Divorciados", d: "Huevos estrellados bañados en salsa roja y verde, acompañados de frijoles.", p: 75 },
            { n: "Con Tocino", d: "Huevos estrellados con tocino crujiente y papas caimán.", p: 70 },
            { n: "A la Mexicana", d: "Huevos revueltos con chile, jitomate y cebolla. Acompañado de frijoles.", p: 65 }
          ]
        },
        {
          nombre: "Clásicos",
          items: [
            { n: "Chilakillers · Arrachera", d: "Rojos o verdes (100 g de arrachera).", p: 120 },
            { n: "Chilakillers · Pollo", d: "Rojos o verdes (100 g de pollo).", p: 85 },
            { n: "Chilakillers · Huevo", d: "Rojos o verdes (2 piezas de huevo).", p: 75 },
            { n: "Chilakillers · Naturales", d: "Rojos o verdes.", p: 65 },
            { n: "Plato de Frutas", d: "Melón, papaya, plátano, fresa, manzana, piña, yogurt y granola.", p: 75 },
            { n: "Croissant", d: "Con jamón y queso.", p: 55 },
            { n: "Pan Francés", d: "Con plátano, fresas, maple y canela.", p: 75 }
          ]
        }
      ]
    },

    {
      id: "comida",
      nombre: "Comida",
      icono: "🍽️",
      secciones: [
        {
          nombre: "Botanas",
          items: [
            { n: "Guacamole", p: 109 },
            { n: "Tostadas de Pollo", d: "(3 pz) Con lechuga, frijoles y crema.", p: 100 },
            { n: "Tostadas de Atún Fresco", d: "(3 pz) Con pepino y aguacate.", p: 149 },
            { n: "Papas Caimán", d: "Papas gajo con receta de la casa.", p: 95 },
            { n: "Papas Caimán Cremoso", d: "Gratinadas con espinaca y tocino.", p: 132 },
            { n: "Vegetales Asados", d: "Berenjena, portobello, jitomate, calabacita y cebolla salteados con aceite de ajo.", p: 95 },
            { n: "Tabla de Quesos", d: "Mezcla de quesos, embutidos y frutos.", p: 205 }
          ]
        },
        {
          nombre: "Ensaladas",
          nota: "Base de lechugas mixtas",
          items: [
            { n: "Ninfa", d: "Pechuga de pollo (200 g), espinaca, queso de cabra, fresa, mango, menta y nuez caramelizada con vinagreta de miel.", p: 132 },
            { n: "Tucán", d: "Arrachera (100 g), arúgula, espinacas, col morada, queso panela asado, tomates cherry, pimiento, aguacate y nuez de la India con aderezo de cacahuate.", p: 187 },
            { n: "Mot-Mot", d: "Camarones al coco, arúgula, espinaca, piña asada, tomates cherry, betabel, nuez de la India y aguacate con vinagreta de jamaica.", p: 195 }
          ]
        },
        {
          nombre: "Emparedados",
          nota: "Con papas caimán",
          items: [
            { n: "Alux", d: "Pechuga de pavo, queso, manzana, nuez, lechuga y alioli de tocino.", p: 121 },
            { n: "Tasiste", d: "Queso panela asado, espinaca, zanahoria, dip de betabel y aguacate.", p: 100 },
            { n: "Mantis", d: "Jitomate, queso panela asado, aguacate, pesto, lechuga y mayonesa.", p: 105 },
            { n: "Fragata", d: "Atún fresco en costra de ajonjolí, alioli de tocino, arúgula y col morada.", p: 193 },
            { n: "Cenzontle", d: "Queso chihuahua, de cabra y mozzarella con espinaca, aceitunas y alioli de tocino.", p: 149 },
            { n: "Balam", d: "Pollo marinado en naranja y chile guajillo, espinaca y queso chihuahua.", p: 138 }
          ]
        },
        {
          nombre: "Crepas",
          nota: "Con ensalada de la casa",
          items: [
            { n: "Ajolote", d: "Queso de cabra, tomate asado, pesto y aceitunas verdes.", p: 100 },
            { n: "Canshan", d: "Pollo marinado en naranja y chile pasilla, espinaca y queso.", p: 132 },
            { n: "Kay", d: "Salmón a la mantequilla, cebolla cambray, espinaca, vino blanco, crema y queso de cabra.", p: 176 }
          ]
        },
        {
          nombre: "Especialidades",
          items: [
            { n: "Brochetas de Pollo", d: "Marinadas en chimichurri, acompañadas de papas caimán y guacamole.", p: 180 },
            { n: "Fajitas de Pollo", d: "Con pimientos, cebolla, queso, guacamole, frijoles y tortillas.", p: 192 },
            { n: "Fajitas de Arrachera", d: "Con pimientos, cebolla, queso, guacamole, frijoles y tortillas.", p: 215 },
            { n: "Pechuga de Pollo al Coco", d: "Servido con ensalada de la casa y puré de camote.", p: 150 },
            { n: "Salmón a la Plancha", d: "Servido con aguacate, puré de camote y ensalada de la casa.", p: 235 },
            { n: "Arrachera Capresse", d: "Mozzarella fresca, pesto, jitomate asado y papas caimán.", p: 264 }
          ]
        },
        {
          nombre: "Pita Wraps",
          items: [
            { n: "Saraguato", d: "Pechuga de pollo (200 g), espinaca, frijoles, cilantro, tomates cherry, aguacate y pimientos.", p: 126 },
            { n: "Flamingo", d: "Pechuga de pollo (200 g), dip de betabel, poro frito, portobello y lechuga.", p: 121 },
            { n: "Komoh", d: "Camarones salteados, tzatziki, arúgula, lechugas, cebolla morada y pimientos.", p: 192 },
            { n: "Wakax", d: "Arrachera, queso, cebolla morada, espinaca, hongos al vino y col morada.", p: 176 },
            { n: "Sula", d: "Salmón al grill, puré de camote, aguacate, cacahuate y hongos al vino.", p: 187 }
          ]
        },
        {
          nombre: "Burgers",
          items: [
            { n: "Pollo", d: "Hongos al vino, jamón, espinaca, queso, poro frito, alioli de tocino y tomate.", p: 160 },
            { n: "Camarón", d: "Cebolla cambray, pimientos, aguacate, queso, lechuga y jitomate.", p: 187 },
            { n: "Arrachera", d: "Tocino, guacamole, queso y lechuga.", p: 190 }
          ]
        },
        {
          nombre: "Postres",
          items: [
            { n: "Volcán de Chocolate", d: "Servido con helado.", p: 100 },
            { n: "Crepa Yaxché", d: "Rellena de queso crema y frutas flameadas en brandy, bañada en nutella y nueces.", p: 132 }
          ]
        }
      ]
    },

    {
      id: "cocteleria",
      nombre: "Coctelería",
      icono: "🍹",
      secciones: [
        {
          nombre: "De la Casa",
          items: [
            { n: "Caimán", d: "Mezcal Espadín, licor de chile Ancho Reyes, pepino, limón.", p: 150 },
            { n: "Gin Sour", d: "Gin Bombay, limón amarillo, angostura.", p: 150 },
            { n: "Sex at Caiman", d: "Vodka Smirnoff, piña, arándano, naranja, maracuyá.", p: 110 },
            { n: "Basil Breeze", d: "Gin Hendrick's, albahaca, limón.", p: 160 },
            { n: "Aperol Spritz", d: "Aperol, Prosecco, agua mineral, naranja.", p: 135 },
            { n: "Campari Spritz", d: "Campari, Prosecco, agua mineral, naranja.", p: 135 },
            { n: "Jamaica Sour", d: "J.W. Red Label, mermelada de jamaica, limón, naranja.", p: 115 },
            { n: "Crack Baby", d: "Smirnoff, maracuyá, piña, arándano.", p: 110 },
            { n: "Bloody Maggy", d: "Tequila 100 Años reposado, vino tinto, limón.", p: 110 },
            { n: "Tropical Mint", d: "(frozen) Vodka Absolut Mandarin, menta, limón.", p: 110 },
            { n: "Amazonic", d: "Vodka Smirnoff, jugo de naranja, maracuyá, amaretto.", p: 110 },
            { n: "Pineapple Express", d: "Bacardí blanco, piña, menta, maracuyá, naranja.", p: 115 },
            { n: "Mezcalón", d: "Mezcal Espadín, menta, maracuyá, limón.", p: 100 },
            { n: "Dulce Carajillo", d: "Licor 43, Frangelico, espresso.", p: 140 },
            { n: "Passion Pachi", d: "Jack Daniel's, Frangelico, maracuyá, guayaba.", p: 145 },
            { n: "Red Ruby", d: "Don Julio blanco, frutos rojos, limón.", p: 135 },
            { n: "Teniente Dan", d: "Flor de Caña añejo, Campari, piña.", p: 140 },
            { n: "Green Vodka", d: "Smirnoff, pepino, limón.", p: 100 },
            { n: "Amaracao", d: "Captain Morgan, Xtabentún, piña, frambuesa.", p: 115 }
          ]
        },
        {
          nombre: "Mezcalitas",
          nota: "Mezcal Espadín, limón, licor de naranja + tu sabor",
          items: [
            { n: "Maracuyá", p: 99 },
            { n: "Tamarindo", p: 99 },
            { n: "Albahaca", p: 99 },
            { n: "Frutos Rojos", p: 99 }
          ]
        },
        {
          nombre: "Mojitos",
          nota: "Havana 3, menta, limón + tu sabor",
          items: [
            { n: "Clásico", p: 99 },
            { n: "Fresa", p: 99 },
            { n: "Maracuyá", p: 99 },
            { n: "Jamaica", p: 99 }
          ]
        },
        {
          nombre: "Clásicos",
          items: [
            { n: "Margarita Original", d: "Don Julio reposado, Cointreau, limón.", p: 149 },
            { n: "Margarita Clásica", d: "Tequila 100 Años, limón, licor de naranja.", p: 99 },
            { n: "Old Fashioned", d: "Bulleit, angostura, azúcar.", p: 160 },
            { n: "Salmoncito", d: "Gin Beefeater, Campari, jugo de toronja, agua tónica.", p: 130 },
            { n: "Daiquiri", d: "(limón, mango o fresa) Bacardí blanco, limón.", p: 99 },
            { n: "Piña Colada", d: "Bacardí blanco, piña, crema de coco.", p: 110 },
            { n: "Margarita de Fresa, Kiwi o Mango", d: "(frozen)", p: 100 },
            { n: "Caipirinha", d: "Cachaça, limón.", p: 100 },
            { n: "Caipiroska", d: "Vodka Smirnoff, limón, azúcar.", p: 100 },
            { n: "Mai Tai", d: "Bacardí blanco y añejo, amaretto, piña, arándano.", p: 100 },
            { n: "Limonada Eléctrica", d: "Midori, Vodka Smirnoff, limón. (frozen)", p: 100 },
            { n: "Bloody Mary", d: "Vodka Smirnoff, limón, salsas, clamato.", p: 109 },
            { n: "Tequila Sunrise", d: "Tequila 100 Años, jugo de naranja, granadina.", p: 100 },
            { n: "Negroni", d: "Gin Beefeater, Campari, Vermouth dulce, naranja.", p: 120 },
            { n: "Long Island", d: "Tequila 100 Años, Bacardí, Smirnoff, Beefeater, limón.", p: 130 },
            { n: "Carajillo", d: "Licor 43, espresso.", p: 130 },
            { n: "Toblerone", d: "Bailey's, Frangelico, Kahlúa, Vodka Smirnoff, chocolate.", p: 150 },
            { n: "Piedra", d: "Tequila reposado, anís dulce, Fernet Branca.", p: 139 },
            { n: "Bull", d: "Bacardí, cerveza oscura, limón.", p: 100 },
            { n: "Sangría", d: "Preguntar variedad de uva.", p: null }
          ]
        },
        {
          nombre: "Vino",
          items: [
            { n: "Blanco de la Casa", d: "Sauvignon Blanc.", p: 99 },
            { n: "Tinto de la Casa", d: "Cabernet · Malbec.", p: 99 },
            { n: "Rosé", d: "Zinfandel.", p: 110 }
          ]
        },
        {
          nombre: "Martinis",
          items: [
            { n: "Pepino", p: 99 },
            { n: "Jamaica", p: 99 },
            { n: "Manzana", p: 99 },
            { n: "Cosmo", p: 99 },
            { n: "Dry", p: 109 },
            { n: "Dirty", p: 125 }
          ]
        }
      ]
    },

    {
      id: "bebidas",
      nombre: "Bebidas",
      icono: "🥃",
      secciones: [
        {
          nombre: "Cerveza Nacional",
          items: [
            { n: "XX (Lager / Ámbar)", p: 45 },
            { n: "Indio", p: 45 },
            { n: "Tecate (Light / Roja)", p: 45 },
            { n: "Sol", p: 49 },
            { n: "Bohemia", p: 55 },
            { n: "Heineken", p: 55 },
            { n: "Amstel Ultra", p: 60 },
            { n: "De barril (XX Lager / Ámbar)", p: 40 }
          ]
        },
        {
          nombre: "Cerveza Artesanal",
          items: [
            { n: "Ceiba Ámbar", p: 95 },
            { n: "Ceiba Stout", p: 95 },
            { n: "Ceiba IPA", p: 95 }
          ]
        },
        {
          nombre: "Mezcal",
          items: [
            { n: "Lulá Espadín", p: 88 },
            { n: "Lulá Ensamble", p: 115 },
            { n: "Lulá Mexicano", p: 99 },
            { n: "Lulá Tobalá", p: 149 },
            { n: "Lulá Sativa THC", p: 210 },
            { n: "Lulá Mezontle", p: 125 },
            { n: "Ponte Chingón", p: 99 },
            { n: "Señor Mono Espadín", p: 105 },
            { n: "Ojo de Tigre", p: 115 },
            { n: "Agavero 3 Silvestres", p: 123 },
            { n: "Amores Cupreata", p: 145 },
            { n: "Río Revuelto Ensamble", p: 145 }
          ]
        },
        {
          nombre: "Tequila",
          items: [
            { n: "José Cuervo Especial", p: 90 },
            { n: "José Cuervo Tradicional", p: 100 },
            { n: "1800 Blanco", p: 99 },
            { n: "1800 Reposado", p: 99 },
            { n: "1800 Añejo", p: 139 },
            { n: "1800 Cristalino Añejo", p: 149 },
            { n: "Herradura Reposado", p: 109 },
            { n: "Don Julio Blanco", p: 115 },
            { n: "Don Julio Reposado", p: 130 },
            { n: "Don Julio Añejo", p: 149 },
            { n: "Don Julio 70", p: 169 },
            { n: "Maestro Dobel Diamante", d: "Consultar precio en tienda.", p: null }
          ]
        },
        {
          nombre: "Whiskey",
          items: [
            { n: "Jameson", p: 99 },
            { n: "Crown Royal", p: 119 },
            { n: "J&B", p: 105 },
            { n: "JW Red Label", p: 115 },
            { n: "JW Black Label", p: 165 },
            { n: "Jack Daniel's Honey", p: 105 },
            { n: "Jack Daniel's", p: 115 },
            { n: "Black and White", p: 110 },
            { n: "Fireball", p: 125 },
            { n: "Buchanan's", p: 149 },
            { n: "Bulleit Bourbon", p: 159 },
            { n: "Chivas 12", p: 150 }
          ]
        },
        {
          nombre: "Vodka",
          items: [
            { n: "Smirnoff", p: 95 },
            { n: "Smirnoff Tamarindo", p: 115 },
            { n: "Absolut Azul", p: 115 },
            { n: "Absolut Mandarin", p: 115 },
            { n: "Absolut Pears", p: 115 },
            { n: "Absolut Mango", p: 115 },
            { n: "Ketel One", p: 130 },
            { n: "Grey Goose", p: 145 },
            { n: "Belvedere", p: 145 },
            { n: "Tito's", p: 149 },
            { n: "Stolichnaya", p: 110 }
          ]
        },
        {
          nombre: "Gin",
          items: [
            { n: "Beefeater", p: 110 },
            { n: "Tanqueray", p: 115 },
            { n: "Bombay", p: 129 },
            { n: "Tanqueray Ten", p: 160 },
            { n: "Hendrick's", p: 170 }
          ]
        },
        {
          nombre: "Ron",
          items: [
            { n: "Bacardí Blanco", p: 90 },
            { n: "Flor de Caña 4 Años", p: 95 },
            { n: "Appleton State", p: 95 },
            { n: "Havana 3", p: 95 },
            { n: "Havana 7", p: 100 },
            { n: "Malibu", p: 90 },
            { n: "Kraken", p: 95 },
            { n: "Captain Morgan Spiced", p: 95 },
            { n: "Matusalem Platino", p: 95 },
            { n: "Matusalem Clásico", p: 95 },
            { n: "Matusalem Gran Reserva", p: 109 },
            { n: "Zacapa 23", p: 170 }
          ]
        },
        {
          nombre: "Licores",
          items: [
            { n: "Jägger", p: 99 },
            { n: "Sambuca Negro", p: 95 },
            { n: "Sambuca Blanco", p: 95 },
            { n: "Baileys", p: 99 },
            { n: "Fernet", p: 105 },
            { n: "Absynth", p: 115 },
            { n: "Midori", p: 85 },
            { n: "Xtabentún", p: 85 },
            { n: "Campari", p: 80 },
            { n: "Aperol", p: 85 },
            { n: "Kahlúa", p: 85 },
            { n: "Amaretto Disaronno", p: 95 },
            { n: "Licor 43", p: 95 },
            { n: "Frangelico", p: 85 },
            { n: "Hypnotic", p: 109 }
          ]
        },
        {
          nombre: "Brandy y Cognac",
          items: [
            { n: "Torres X", d: "Brandy.", p: 105 },
            { n: "Martell VS", d: "Cognac.", p: 220 }
          ]
        },
        {
          nombre: "Preparados",
          items: [
            { n: "Vaso Michelado", p: 18 },
            { n: "Vaso Chelado", p: 15 },
            { n: "Vaso Ojo Rojo", p: 25 },
            { n: "Clamato Preparado", p: 55 }
          ]
        },
        {
          nombre: "Shots",
          items: [
            { n: "Jägger Bomb", d: "Jägger, Red Bull.", p: 139 },
            { n: "Waterfall", d: "Vodka raspberry, Red Bull, curaçao.", p: 139 },
            { n: "Bufanda", d: "Hypnotiq, Jägger.", p: 115 },
            { n: "Flaming B52", d: "Bailey's, Kahlúa, Cointreau.", p: 99 },
            { n: "Derrame Cerebral", d: "Licor de durazno, Bailey's.", p: 80 },
            { n: "Cucaracha", d: "Tequila, licor de café.", p: 80 },
            { n: "Sacrificio Maya", d: "1800 blanco, Xtabentún, frambuesa.", p: 80 }
          ]
        },
        {
          nombre: "Aguas y Refrescos",
          items: [
            { n: "Red Bull", p: 70 },
            { n: "Red Bull Tropical", p: 70 },
            { n: "Limonada / Naranjada", p: 45 },
            { n: "Limonada pepino y menta", p: 50 },
            { n: "Agua de piña", p: 45 },
            { n: "Agua mineral 325 ml", p: 35 },
            { n: "Agua Sta. María 400 ml", p: 35 },
            { n: "Agua Quina Schweppes", p: 40 },
            { n: "Sodas", p: 39 }
          ]
        }
      ]
    }
  ]
};
