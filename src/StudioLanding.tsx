// AUTO-GENERATED from store/landing.tmpl.html + landing-strings.json. Do not hand-edit.
import { useEffect, useMemo, useRef, useState } from "react";
const STR: Record<string, Record<string,string>> = {
  "ru": {
    "page_title": "Space Attack Studio - собери свою арену",
    "nav_feat": "Возможности",
    "nav_rewards": "Награды",
    "nav_faq": "Вопросы",
    "nav_game": "Игра",
    "nav_login": "Войти",
    "cta_build": "Построить уровень",
    "hero_title_1": "Собери свою",
    "hero_title_2": "арену",
    "hero_lead": "Рисуй уровни для Space Attack прямо в браузере. Ставь платформы, задавай текстуры, проверяй их в бою и делись ссылкой. Всё, что построишь, играется на том же движке, что и Cosmos Arena.",
    "cta_how": "Как это работает",
    "hero_undercta": "Без установки, бесплатно, сохраняется в браузере",
    "hero_frame_alt": "Редактор уровней Space Attack Studio",
    "badge_walkability": "Проверка проходимости",
    "badge_textures": "Текстуры на грани",
    "badge_test": "Тест в один клик",
    "badge_parallax": "Параллакс и глубина",
    "feat_kick": "Возможности",
    "feat_title": "Что умеет редактор",
    "feat_sub": "От первого блока до играбельной карты в одном окне. Без кода.",
    "feat_1_title": "Ставь блоки и тяни по сетке",
    "feat_1_text": "Платформы, рампы, мосты, острова и спавны. Двигай, меняй ширину, всё со снапом.",
    "feat_2_title": "Крась грани текстурами",
    "feat_2_text": "Материалы на каждую сторону блока и готовые стили: станция, шахта, кристалл, обломки.",
    "feat_3_title": "Смотри с любого угла, хоть в каркасе",
    "feat_3_text": "Виды фронт, три четверти, сверху. Каркас, слои глубины и параллакс для объёма.",
    "feat_4_title": "Играй прямо в редакторе",
    "feat_4_text": "Один клик, и ты бегаешь по своей карте с реальной физикой, прыжками и стрельбой.",
    "how_kick": "Как это работает",
    "how_title": "Четыре шага до своей арены",
    "step_1_title": "Набросай",
    "step_1_text": "Кинь платформы и спавны из палитры. Сетка и снап держат геометрию ровной.",
    "step_2_title": "Текстуры",
    "step_2_text": "Выбери стиль и раскрась грани. Добавь фон для глубины.",
    "step_3_title": "Играй",
    "step_3_text": "Жми тест и проверь уровень в реальном бою на том же движке.",
    "step_4_title": "Делись",
    "step_4_text": "Сохрани и отправь ссылку. Чужие уровни у тебя в один клик.",
    "show1_kick": "Редактор",
    "show1_title": "Строй визуально, без кода",
    "show1_sub": "Выделяй, двигай, меняй размер прямо в 3D. Тулбар сверху, палитра снизу, как в настоящем движке.",
    "show1_li_1": "Гизмо перемещения, поворота и масштаба",
    "show1_li_2": "Снап к сетке и шаг 0.5",
    "show1_li_3": "Отмена и повтор, дубли, слои глубины",
    "show1_li_4": "Виды: фронт, три четверти, сверху",
    "show1_shot_alt": "Редактор, геометрия уровня",
    "show2_kick": "Тест",
    "show2_title": "Сразу играй, что построил",
    "show2_sub": "Никакого экспорта и сборки. Один клик, и ты внутри своего уровня, с реальной физикой, прыжками и стрельбой.",
    "show2_li_1": "Тест за танка, дамагера или снайпера",
    "show2_li_2": "Та же физика и оружие, что в Cosmos Arena",
    "show2_li_3": "Правка на лету: вернулся, поменял, снова в бой",
    "show2_shot_alt": "Тест, игра на своём уровне",
    "learn_kick": "Уроки",
    "learn_title": "Разберёшься за пять минут",
    "learn_sub": "Три вещи, которые нужно знать, чтобы собрать и сохранить первый уровень.",
    "guide_1_tag": "С чего начать",
    "guide_1_title": "Собери геометрию",
    "guide_1_text": "Кинь пол и пару платформ из палитры снизу, поставь спавн. Редактор сразу подсветит, где боец пройдёт, а где нет: зелёное можно, красное нет.",
    "guide_2_tag": "Сохранение",
    "guide_2_title": "Что нажать",
    "guide_2_text_1": "Уровень сам сохраняется в браузере.",
    "guide_2_kbd_save": "Сохранить",
    "guide_2_text_2": "кладёт его в твою библиотеку,",
    "guide_2_kbd_export": "Экспорт",
    "guide_2_text_3": "скачивает файл,",
    "guide_2_kbd_share": "Поделиться",
    "guide_2_text_4": "даёт ссылку на карту.",
    "guide_3_tag": "Свои текстуры",
    "guide_3_title": "Загрузи картинку",
    "guide_3_text_1": "Выбери блок, открой слот текстуры и нажми",
    "guide_3_kbd_upload": "Загрузить свою",
    "guide_3_text_2": "Картинка ляжет на грань. Для готового уровня положи файл в проект и впиши путь, чтобы он сохранился навсегда.",
    "rewards_kick": "Награды",
    "rewards_title": "Твой уровень в игре, ты получаешь деньги",
    "rewards_sub": "Лучшие карты попадают в общую ротацию Cosmos Arena. За принятый уровень платим автору в USDT или GRAM. Размер зависит от качества карты и того, как часто на ней играют.",
    "rstep_1_title": "Собери и отправь",
    "rstep_1_text": "Готовый уровень отправляешь на ревью прямо из редактора.",
    "rstep_2_title": "Попал в игру",
    "rstep_2_text": "Проходит проверку и встаёт в ротацию для всех игроков.",
    "rstep_3_title": "Получи выплату",
    "rstep_3_text": "Награда приходит в USDT или GRAM в Telegram.",
    "crit_1": "Проходится всеми ролями, зелёный индикатор",
    "crit_2": "Честная симметрия и удобные бои",
    "crit_3": "Интересно играть, тогда карта живёт в ротации дольше",
    "coin_usdt_sub": "стейблкоин, вывод на кошелёк",
    "coin_gram_sub": "прямо в Telegram",
    "faq_kick": "Вопросы",
    "faq_title": "Коротко о главном",
    "faq_free_q": "Это бесплатно?",
    "faq_free_a": "Да. Редактор открывается в браузере, без установки и без оплаты.",
    "faq_account_q": "Нужен аккаунт?",
    "faq_account_a": "Чтобы просто строить, нет. Аккаунт нужен, только если хочешь отправить уровень на ревью и получить награду.",
    "faq_save_q": "Где сохраняется уровень?",
    "faq_save_a": "В браузере автоматически. Можно скачать файлом или поделиться ссылкой, чтобы точно не потерять.",
    "faq_skill_q": "Что нужно уметь?",
    "faq_skill_a": "Ничего. Ставишь платформы мышкой, редактор сам подсказывает, где пройдёт боец.",
    "faq_engine_q": "На чём играется мой уровень?",
    "faq_engine_a": "На том же движке, что и Cosmos Arena, с настоящей физикой и оружием.",
    "faq_reward_q": "Как получить награду?",
    "faq_reward_a": "Собери уровень и отправь на ревью. Если попал в игру, платим в USDT или GRAM.",
    "game_kick": "Про игру",
    "game_sub": "Живая 2.5D PvP-арена: 11 героев и три роли. Studio это тот же движок, отданный тебе в руки. Всё, что ты строишь, играется по-настоящему.",
    "stat_heroes": "героев",
    "stat_roles": "роли: танк, урон, снайпер",
    "stat_engine": "движок для игры и редактора",
    "stat_levels": "уровней от игроков",
    "final_kick": "Готов?",
    "final_title": "Собери свой уровень прямо сейчас",
    "final_sub": "Открывается в браузере. Бесплатно. Твоё творчество остаётся с тобой.",
    "final_undercta": "Start for free, no install, right in your browser",
    "feedback_kick": "Обратная связь",
    "feedback_title": "Есть идея, вопрос или нашёл баг?",
    "feedback_sub": "Напиши нам напрямую в Telegram. Читаем всё и отвечаем.",
    "feedback_cta": "Написать в Telegram",
    "footer_copy": "© 2026 Space Attack",
    "footer_support": "Поддержка"
  },
  "en": {
    "page_title": "Space Attack Studio - build your own arena",
    "nav_feat": "Features",
    "nav_rewards": "Rewards",
    "nav_faq": "FAQ",
    "nav_game": "Game",
    "nav_login": "Log in",
    "cta_build": "Build a level",
    "hero_title_1": "Build your own",
    "hero_title_2": "arena",
    "hero_lead": "Design levels for Space Attack right in your browser. Drop platforms, paint textures, test them in real combat and share a link. Everything you build runs on the same engine as Cosmos Arena.",
    "cta_how": "How it works",
    "hero_undercta": "No install, free, saved in your browser",
    "hero_frame_alt": "Space Attack Studio level editor",
    "badge_walkability": "Walkability check",
    "badge_textures": "Textures on every face",
    "badge_test": "One-click test",
    "badge_parallax": "Parallax and depth",
    "feat_kick": "Features",
    "feat_title": "What the editor can do",
    "feat_sub": "From your first block to a playable map in one window. No code.",
    "feat_1_title": "Drop blocks, snap to the grid",
    "feat_1_text": "Platforms, ramps, bridges, islands and spawns. Move them, resize the width, everything snaps.",
    "feat_2_title": "Paint faces with textures",
    "feat_2_text": "Materials for every side of a block plus ready-made styles: station, mine, crystal, debris.",
    "feat_3_title": "View from any angle, even wireframe",
    "feat_3_text": "Front, three-quarter and top views. Wireframe, depth layers and parallax for real volume.",
    "feat_4_title": "Play right in the editor",
    "feat_4_text": "One click and you're running your own map with real physics, jumps and shooting.",
    "how_kick": "How it works",
    "how_title": "Four steps to your own arena",
    "step_1_title": "Sketch it",
    "step_1_text": "Drop platforms and spawns from the palette. The grid and snap keep the geometry clean.",
    "step_2_title": "Textures",
    "step_2_text": "Pick a style and paint the faces. Add a backdrop for depth.",
    "step_3_title": "Play",
    "step_3_text": "Hit test and check your level in real combat on the same engine.",
    "step_4_title": "Share",
    "step_4_text": "Save it and send the link. Other players' levels are one click away.",
    "show1_kick": "Editor",
    "show1_title": "Build visually, no code",
    "show1_sub": "Select, move and resize right in 3D. Toolbar on top, palette below, just like a real engine.",
    "show1_li_1": "Move, rotate and scale gizmos",
    "show1_li_2": "Grid snap with a 0.5 step",
    "show1_li_3": "Undo and redo, duplicates, depth layers",
    "show1_li_4": "Views: front, three-quarter, top",
    "show1_shot_alt": "Editor, level geometry",
    "show2_kick": "Test",
    "show2_title": "Play what you built, instantly",
    "show2_sub": "No exporting, no build step. One click and you're inside your level, with real physics, jumps and shooting.",
    "show2_li_1": "Test as a tank, damage or sniper",
    "show2_li_2": "The same physics and weapons as Cosmos Arena",
    "show2_li_3": "Tweak on the fly: jump out, change it, back into battle",
    "show2_shot_alt": "Test, playing your own level",
    "learn_kick": "Guides",
    "learn_title": "Figure it out in five minutes",
    "learn_sub": "Three things you need to know to build and save your first level.",
    "guide_1_tag": "Where to start",
    "guide_1_title": "Build the geometry",
    "guide_1_text": "Drop a floor and a couple of platforms from the palette below, then place a spawn. The editor instantly highlights where a fighter can walk and where they can't: green means yes, red means no.",
    "guide_2_tag": "Saving",
    "guide_2_title": "What to press",
    "guide_2_text_1": "Your level saves itself in the browser.",
    "guide_2_kbd_save": "Save",
    "guide_2_text_2": "puts it in your library,",
    "guide_2_kbd_export": "Export",
    "guide_2_text_3": "downloads the file,",
    "guide_2_kbd_share": "Share",
    "guide_2_text_4": "gives you a link to the map.",
    "guide_3_tag": "Your own textures",
    "guide_3_title": "Upload an image",
    "guide_3_text_1": "Pick a block, open the texture slot and hit",
    "guide_3_kbd_upload": "Upload your own",
    "guide_3_text_2": "The image lands on the face. For a finished level, drop the file into the project and enter the path so it sticks forever.",
    "rewards_kick": "Rewards",
    "rewards_title": "Your level in the game, you get paid",
    "rewards_sub": "The best maps make it into the shared Cosmos Arena rotation. We pay the author in USDT or GRAM for an accepted level. The amount depends on the map's quality and how often people play it.",
    "rstep_1_title": "Build and submit",
    "rstep_1_text": "Send your finished level for review straight from the editor.",
    "rstep_2_title": "Into the game",
    "rstep_2_text": "It passes review and joins the rotation for every player.",
    "rstep_3_title": "Get paid",
    "rstep_3_text": "Your reward arrives in USDT or GRAM on Telegram.",
    "crit_1": "Playable by every role, green indicator",
    "crit_2": "Fair symmetry and clean fights",
    "crit_3": "Fun to play, so the map stays in rotation longer",
    "coin_usdt_sub": "stablecoin, withdraw to your wallet",
    "coin_gram_sub": "right in Telegram",
    "faq_kick": "FAQ",
    "faq_title": "The short version",
    "faq_free_q": "Is it free?",
    "faq_free_a": "Yes. The editor opens in your browser, no install and no payment.",
    "faq_account_q": "Do I need an account?",
    "faq_account_a": "Not just to build. You only need an account if you want to submit a level for review and earn a reward.",
    "faq_save_q": "Where is my level saved?",
    "faq_save_a": "In the browser automatically. You can download it as a file or share a link so you never lose it.",
    "faq_skill_q": "What do I need to know?",
    "faq_skill_a": "Nothing. You drop platforms with the mouse and the editor tells you where a fighter can walk.",
    "faq_engine_q": "What does my level run on?",
    "faq_engine_a": "The same engine as Cosmos Arena, with real physics and weapons.",
    "faq_reward_q": "How do I get a reward?",
    "faq_reward_a": "Build a level and submit it for review. If it makes the game, we pay in USDT or GRAM.",
    "game_kick": "About the game",
    "game_sub": "A living 2.5D PvP arena: 11 heroes and three roles. Studio is that same engine, handed to you. Everything you build plays for real.",
    "stat_heroes": "heroes",
    "stat_roles": "roles: tank, damage, sniper",
    "stat_engine": "engine for the game and editor",
    "stat_levels": "player-made levels",
    "final_kick": "Ready?",
    "final_title": "Build your level right now",
    "final_sub": "Opens in your browser. Free. Your creations stay with you.",
    "final_undercta": "Start for free, no install, right in your browser",
    "feedback_kick": "Feedback",
    "feedback_title": "Got an idea, a question or found a bug?",
    "feedback_sub": "Message us directly on Telegram. We read everything and reply.",
    "feedback_cta": "Message us on Telegram",
    "footer_copy": "© 2026 Space Attack",
    "footer_support": "Support"
  },
  "es": {
    "page_title": "Space Attack Studio - crea tu propia arena",
    "nav_feat": "Funciones",
    "nav_rewards": "Recompensas",
    "nav_faq": "Preguntas",
    "nav_game": "Juego",
    "nav_login": "Entrar",
    "cta_build": "Crear un nivel",
    "hero_title_1": "Crea tu propia",
    "hero_title_2": "arena",
    "hero_lead": "Diseña niveles para Space Attack directamente en el navegador. Coloca plataformas, pinta texturas, pruébalas en combate y comparte el enlace. Todo lo que construyes corre en el mismo motor que Cosmos Arena.",
    "cta_how": "Cómo funciona",
    "hero_undercta": "Sin instalar, gratis, se guarda en el navegador",
    "hero_frame_alt": "Editor de niveles de Space Attack Studio",
    "badge_walkability": "Chequeo de transitabilidad",
    "badge_textures": "Texturas en cada cara",
    "badge_test": "Prueba en un clic",
    "badge_parallax": "Parallax y profundidad",
    "feat_kick": "Funciones",
    "feat_title": "Lo que hace el editor",
    "feat_sub": "Del primer bloque a un mapa jugable en una sola ventana. Sin código.",
    "feat_1_title": "Coloca bloques y arrastra por la rejilla",
    "feat_1_text": "Plataformas, rampas, puentes, islas y puntos de aparición. Muévelos, cambia el ancho, todo con ajuste automático.",
    "feat_2_title": "Pinta las caras con texturas",
    "feat_2_text": "Materiales para cada lado del bloque y estilos listos: estación, mina, cristal, escombros.",
    "feat_3_title": "Míralo desde cualquier ángulo, hasta en malla",
    "feat_3_text": "Vistas frontal, tres cuartos y cenital. Malla, capas de profundidad y parallax para dar volumen.",
    "feat_4_title": "Juega dentro del propio editor",
    "feat_4_text": "Un clic y ya corres por tu mapa con física real, saltos y disparos.",
    "how_kick": "Cómo funciona",
    "how_title": "Cuatro pasos hacia tu arena",
    "step_1_title": "Boceta",
    "step_1_text": "Suelta plataformas y puntos de aparición desde la paleta. La rejilla y el ajuste mantienen la geometría limpia.",
    "step_2_title": "Texturas",
    "step_2_text": "Elige un estilo y pinta las caras. Añade un fondo para dar profundidad.",
    "step_3_title": "Juega",
    "step_3_text": "Pulsa probar y revisa tu nivel en combate real sobre el mismo motor.",
    "step_4_title": "Comparte",
    "step_4_text": "Guárdalo y envía el enlace. Los niveles de otros están a un clic.",
    "show1_kick": "Editor",
    "show1_title": "Construye en visual, sin código",
    "show1_sub": "Selecciona, mueve y redimensiona directo en 3D. Barra arriba, paleta abajo, como en un motor de verdad.",
    "show1_li_1": "Gizmos de mover, rotar y escalar",
    "show1_li_2": "Ajuste a la rejilla con paso de 0.5",
    "show1_li_3": "Deshacer y rehacer, duplicados, capas de profundidad",
    "show1_li_4": "Vistas: frontal, tres cuartos, cenital",
    "show1_shot_alt": "Editor, geometría del nivel",
    "show2_kick": "Prueba",
    "show2_title": "Juega al instante lo que construiste",
    "show2_sub": "Sin exportar ni compilar. Un clic y estás dentro de tu nivel, con física real, saltos y disparos.",
    "show2_li_1": "Prueba como tanque, daño o francotirador",
    "show2_li_2": "La misma física y armas que en Cosmos Arena",
    "show2_li_3": "Ajusta sobre la marcha: sales, cambias, vuelves al combate",
    "show2_shot_alt": "Prueba, jugando tu propio nivel",
    "learn_kick": "Guías",
    "learn_title": "Lo pillas en cinco minutos",
    "learn_sub": "Tres cosas que hay que saber para armar y guardar tu primer nivel.",
    "guide_1_tag": "Por dónde empezar",
    "guide_1_title": "Arma la geometría",
    "guide_1_text": "Suelta un suelo y un par de plataformas desde la paleta de abajo y pon un punto de aparición. El editor marca al instante por dónde pasa un combatiente y por dónde no: verde sí, rojo no.",
    "guide_2_tag": "Guardado",
    "guide_2_title": "Qué pulsar",
    "guide_2_text_1": "El nivel se guarda solo en el navegador.",
    "guide_2_kbd_save": "Guardar",
    "guide_2_text_2": "lo mete en tu biblioteca,",
    "guide_2_kbd_export": "Exportar",
    "guide_2_text_3": "descarga el archivo,",
    "guide_2_kbd_share": "Compartir",
    "guide_2_text_4": "te da un enlace al mapa.",
    "guide_3_tag": "Tus propias texturas",
    "guide_3_title": "Sube una imagen",
    "guide_3_text_1": "Elige un bloque, abre la ranura de textura y pulsa",
    "guide_3_kbd_upload": "Subir la mía",
    "guide_3_text_2": "La imagen se coloca en la cara. Para un nivel final, mete el archivo en el proyecto y escribe la ruta para que quede para siempre.",
    "rewards_kick": "Recompensas",
    "rewards_title": "Tu nivel en el juego, tú cobras",
    "rewards_sub": "Los mejores mapas entran en la rotación común de Cosmos Arena. Por un nivel aceptado le pagamos al autor en USDT o GRAM. El monto depende de la calidad del mapa y de cuánto se juega.",
    "rstep_1_title": "Arma y envía",
    "rstep_1_text": "Mandas tu nivel terminado a revisión directamente desde el editor.",
    "rstep_2_title": "Entra al juego",
    "rstep_2_text": "Pasa la revisión y entra en la rotación para todos los jugadores.",
    "rstep_3_title": "Cobra",
    "rstep_3_text": "La recompensa llega en USDT o GRAM por Telegram.",
    "crit_1": "Jugable por todos los roles, indicador verde",
    "crit_2": "Simetría justa y peleas cómodas",
    "crit_3": "Divertido de jugar, así el mapa vive más en la rotación",
    "coin_usdt_sub": "stablecoin, retiro a tu billetera",
    "coin_gram_sub": "directo en Telegram",
    "faq_kick": "Preguntas",
    "faq_title": "Lo esencial en breve",
    "faq_free_q": "¿Es gratis?",
    "faq_free_a": "Sí. El editor se abre en el navegador, sin instalar y sin pagar.",
    "faq_account_q": "¿Necesito cuenta?",
    "faq_account_a": "Para solo construir, no. La cuenta hace falta únicamente si quieres enviar un nivel a revisión y ganar recompensa.",
    "faq_save_q": "¿Dónde se guarda el nivel?",
    "faq_save_a": "En el navegador, automáticamente. Puedes descargarlo como archivo o compartir un enlace para no perderlo.",
    "faq_skill_q": "¿Qué hay que saber?",
    "faq_skill_a": "Nada. Colocas plataformas con el ratón y el editor te indica por dónde pasa un combatiente.",
    "faq_engine_q": "¿En qué corre mi nivel?",
    "faq_engine_a": "En el mismo motor que Cosmos Arena, con física y armas de verdad.",
    "faq_reward_q": "¿Cómo consigo la recompensa?",
    "faq_reward_a": "Arma un nivel y envíalo a revisión. Si entra al juego, pagamos en USDT o GRAM.",
    "game_kick": "Sobre el juego",
    "game_sub": "Una arena PvP 2.5D viva: 11 héroes y tres roles. Studio es ese mismo motor, puesto en tus manos. Todo lo que construyes se juega de verdad.",
    "stat_heroes": "héroes",
    "stat_roles": "roles: tanque, daño, francotirador",
    "stat_engine": "motor para el juego y el editor",
    "stat_levels": "niveles hechos por jugadores",
    "final_kick": "¿Listo?",
    "final_title": "Crea tu nivel ahora mismo",
    "final_sub": "Se abre en el navegador. Gratis. Tu creación se queda contigo.",
    "final_undercta": "Empieza gratis, sin instalar, directo en tu navegador",
    "feedback_kick": "Comentarios",
    "feedback_title": "¿Tienes una idea, una duda o encontraste un bug?",
    "feedback_sub": "Escríbenos directo por Telegram. Leemos todo y respondemos.",
    "feedback_cta": "Escríbenos por Telegram",
    "footer_copy": "© 2026 Space Attack",
    "footer_support": "Soporte"
  },
  "pt": {
    "page_title": "Space Attack Studio - crie a sua arena",
    "nav_feat": "Recursos",
    "nav_rewards": "Recompensas",
    "nav_faq": "Perguntas",
    "nav_game": "Jogo",
    "nav_login": "Entrar",
    "cta_build": "Criar um nível",
    "hero_title_1": "Crie a sua",
    "hero_title_2": "arena",
    "hero_lead": "Crie níveis para Space Attack direto no navegador. Coloque plataformas, pinte texturas, teste no combate e compartilhe o link. Tudo o que você constrói roda no mesmo motor que Cosmos Arena.",
    "cta_how": "Como funciona",
    "hero_undercta": "Sem instalar, grátis, salvo no navegador",
    "hero_frame_alt": "Editor de níveis do Space Attack Studio",
    "badge_walkability": "Verificação de passagem",
    "badge_textures": "Texturas em cada face",
    "badge_test": "Teste em um clique",
    "badge_parallax": "Parallax e profundidade",
    "feat_kick": "Recursos",
    "feat_title": "O que o editor faz",
    "feat_sub": "Do primeiro bloco a um mapa jogável em uma janela só. Sem código.",
    "feat_1_title": "Coloque blocos e arraste na grade",
    "feat_1_text": "Plataformas, rampas, pontes, ilhas e pontos de spawn. Mova, ajuste a largura, tudo com encaixe.",
    "feat_2_title": "Pinte as faces com texturas",
    "feat_2_text": "Materiais para cada lado do bloco e estilos prontos: estação, mina, cristal, destroços.",
    "feat_3_title": "Veja de qualquer ângulo, até em wireframe",
    "feat_3_text": "Vistas frontal, três quartos e de cima. Wireframe, camadas de profundidade e parallax para dar volume.",
    "feat_4_title": "Jogue dentro do próprio editor",
    "feat_4_text": "Um clique e você já corre pelo seu mapa com física real, pulos e tiros.",
    "how_kick": "Como funciona",
    "how_title": "Quatro passos até a sua arena",
    "step_1_title": "Esboce",
    "step_1_text": "Solte plataformas e spawns da paleta. A grade e o encaixe deixam a geometria certinha.",
    "step_2_title": "Texturas",
    "step_2_text": "Escolha um estilo e pinte as faces. Adicione um fundo para dar profundidade.",
    "step_3_title": "Jogue",
    "step_3_text": "Aperte testar e confira seu nível em combate real no mesmo motor.",
    "step_4_title": "Compartilhe",
    "step_4_text": "Salve e mande o link. Os níveis dos outros ficam a um clique.",
    "show1_kick": "Editor",
    "show1_title": "Construa no visual, sem código",
    "show1_sub": "Selecione, mova e redimensione direto em 3D. Barra em cima, paleta embaixo, como num motor de verdade.",
    "show1_li_1": "Gizmos de mover, girar e escalar",
    "show1_li_2": "Encaixe na grade com passo de 0.5",
    "show1_li_3": "Desfazer e refazer, duplicatas, camadas de profundidade",
    "show1_li_4": "Vistas: frontal, três quartos, de cima",
    "show1_shot_alt": "Editor, geometria do nível",
    "show2_kick": "Teste",
    "show2_title": "Jogue na hora o que construiu",
    "show2_sub": "Nada de exportar ou compilar. Um clique e você está dentro do seu nível, com física real, pulos e tiros.",
    "show2_li_1": "Teste como tanque, dano ou sniper",
    "show2_li_2": "A mesma física e armas do Cosmos Arena",
    "show2_li_3": "Ajuste na hora: saia, mude, volte pro combate",
    "show2_shot_alt": "Teste, jogando o seu próprio nível",
    "learn_kick": "Guias",
    "learn_title": "Você entende em cinco minutos",
    "learn_sub": "Três coisas que você precisa saber para montar e salvar o primeiro nível.",
    "guide_1_tag": "Por onde começar",
    "guide_1_title": "Monte a geometria",
    "guide_1_text": "Solte um chão e umas plataformas da paleta de baixo e coloque um spawn. O editor mostra na hora por onde um lutador passa e por onde não: verde pode, vermelho não.",
    "guide_2_tag": "Como salvar",
    "guide_2_title": "O que apertar",
    "guide_2_text_1": "O nível se salva sozinho no navegador.",
    "guide_2_kbd_save": "Salvar",
    "guide_2_text_2": "coloca ele na sua biblioteca,",
    "guide_2_kbd_export": "Exportar",
    "guide_2_text_3": "baixa o arquivo,",
    "guide_2_kbd_share": "Compartilhar",
    "guide_2_text_4": "gera um link para o mapa.",
    "guide_3_tag": "Suas próprias texturas",
    "guide_3_title": "Suba uma imagem",
    "guide_3_text_1": "Escolha um bloco, abra o slot de textura e aperte",
    "guide_3_kbd_upload": "Subir a minha",
    "guide_3_text_2": "A imagem cai na face. Para um nível final, coloque o arquivo no projeto e escreva o caminho para ele ficar salvo para sempre.",
    "rewards_kick": "Recompensas",
    "rewards_title": "Seu nível no jogo, você recebe",
    "rewards_sub": "Os melhores mapas entram na rotação comum do Cosmos Arena. Por um nível aceito pagamos o autor em USDT ou GRAM. O valor depende da qualidade do mapa e de quanto ele é jogado.",
    "rstep_1_title": "Monte e envie",
    "rstep_1_text": "Você manda o nível pronto para revisão direto do editor.",
    "rstep_2_title": "Entrou no jogo",
    "rstep_2_text": "Passa na revisão e entra na rotação para todos os jogadores.",
    "rstep_3_title": "Receba",
    "rstep_3_text": "A recompensa chega em USDT ou GRAM pelo Telegram.",
    "crit_1": "Jogável por todos os papéis, indicador verde",
    "crit_2": "Simetria justa e combates confortáveis",
    "crit_3": "Divertido de jogar, aí o mapa fica mais tempo na rotação",
    "coin_usdt_sub": "stablecoin, saque para a carteira",
    "coin_gram_sub": "direto no Telegram",
    "faq_kick": "Perguntas",
    "faq_title": "O essencial em resumo",
    "faq_free_q": "É grátis?",
    "faq_free_a": "Sim. O editor abre no navegador, sem instalar e sem pagar.",
    "faq_account_q": "Precisa de conta?",
    "faq_account_a": "Só para construir, não. A conta só é necessária se você quiser enviar um nível para revisão e ganhar recompensa.",
    "faq_save_q": "Onde o nível é salvo?",
    "faq_save_a": "No navegador, automaticamente. Dá para baixar como arquivo ou compartilhar um link para não perder.",
    "faq_skill_q": "O que preciso saber?",
    "faq_skill_a": "Nada. Você coloca plataformas com o mouse e o editor mostra por onde o lutador passa.",
    "faq_engine_q": "Em que meu nível roda?",
    "faq_engine_a": "No mesmo motor que Cosmos Arena, com física e armas de verdade.",
    "faq_reward_q": "Como ganho a recompensa?",
    "faq_reward_a": "Monte um nível e envie para revisão. Se entrar no jogo, pagamos em USDT ou GRAM.",
    "game_kick": "Sobre o jogo",
    "game_sub": "Uma arena PvP 2.5D viva: 11 heróis e três papéis. Studio é esse mesmo motor, na sua mão. Tudo o que você constrói é jogado de verdade.",
    "stat_heroes": "heróis",
    "stat_roles": "papéis: tanque, dano, sniper",
    "stat_engine": "motor para o jogo e o editor",
    "stat_levels": "níveis feitos por jogadores",
    "final_kick": "Pronto?",
    "final_title": "Monte seu nível agora mesmo",
    "final_sub": "Abre no navegador. Grátis. Sua criação fica com você.",
    "final_undercta": "Comece grátis, sem instalar, direto no navegador",
    "feedback_kick": "Feedback",
    "feedback_title": "Tem uma ideia, uma dúvida ou achou um bug?",
    "feedback_sub": "Fale com a gente direto no Telegram. Lemos tudo e respondemos.",
    "feedback_cta": "Falar no Telegram",
    "footer_copy": "© 2026 Space Attack",
    "footer_support": "Suporte"
  },
  "de": {
    "page_title": "Space Attack Studio - bau deine eigene Arena",
    "nav_feat": "Features",
    "nav_rewards": "Belohnungen",
    "nav_faq": "Fragen",
    "nav_game": "Spiel",
    "nav_login": "Anmelden",
    "cta_build": "Level bauen",
    "hero_title_1": "Bau deine eigene",
    "hero_title_2": "Arena",
    "hero_lead": "Baue Level für Space Attack direkt im Browser. Setze Plattformen, verpasse ihnen Texturen, teste sie im Kampf und teile den Link. Alles, was du baust, läuft auf derselben Engine wie Cosmos Arena.",
    "cta_how": "So funktioniert's",
    "hero_undercta": "Ohne Installation, kostenlos, im Browser gespeichert",
    "hero_frame_alt": "Space Attack Studio Level-Editor",
    "badge_walkability": "Begehbarkeits-Check",
    "badge_textures": "Texturen auf jeder Fläche",
    "badge_test": "Test mit einem Klick",
    "badge_parallax": "Parallax und Tiefe",
    "feat_kick": "Features",
    "feat_title": "Was der Editor kann",
    "feat_sub": "Vom ersten Block bis zur spielbaren Map in einem Fenster. Ohne Code.",
    "feat_1_title": "Blöcke setzen und am Raster ziehen",
    "feat_1_text": "Plattformen, Rampen, Brücken, Inseln und Spawns. Verschieben, Breite ändern, alles rastet ein.",
    "feat_2_title": "Flächen mit Texturen bemalen",
    "feat_2_text": "Materialien für jede Seite eines Blocks plus fertige Stile: Station, Mine, Kristall, Trümmer.",
    "feat_3_title": "Aus jedem Winkel schauen, auch im Wireframe",
    "feat_3_text": "Front-, Dreiviertel- und Draufsicht. Wireframe, Tiefenebenen und Parallax für echtes Volumen.",
    "feat_4_title": "Direkt im Editor spielen",
    "feat_4_text": "Ein Klick und du rennst über deine eigene Map mit echter Physik, Sprüngen und Schüssen.",
    "how_kick": "So funktioniert's",
    "how_title": "Vier Schritte zu deiner Arena",
    "step_1_title": "Skizzieren",
    "step_1_text": "Zieh Plattformen und Spawns aus der Palette. Raster und Snap halten die Geometrie sauber.",
    "step_2_title": "Texturen",
    "step_2_text": "Wähl einen Stil und bemal die Flächen. Füg einen Hintergrund für Tiefe hinzu.",
    "step_3_title": "Spielen",
    "step_3_text": "Drück auf Test und prüf dein Level im echten Kampf auf derselben Engine.",
    "step_4_title": "Teilen",
    "step_4_text": "Speichern und Link verschicken. Fremde Level sind einen Klick entfernt.",
    "show1_kick": "Editor",
    "show1_title": "Visuell bauen, ohne Code",
    "show1_sub": "Auswählen, verschieben, skalieren direkt in 3D. Toolbar oben, Palette unten, wie in einer echten Engine.",
    "show1_li_1": "Gizmos zum Verschieben, Drehen und Skalieren",
    "show1_li_2": "Raster-Snap mit 0.5er-Schritt",
    "show1_li_3": "Rückgängig und Wiederholen, Duplikate, Tiefenebenen",
    "show1_li_4": "Ansichten: Front, Dreiviertel, oben",
    "show1_shot_alt": "Editor, Level-Geometrie",
    "show2_kick": "Test",
    "show2_title": "Spiel sofort, was du gebaut hast",
    "show2_sub": "Kein Export, kein Build. Ein Klick und du bist in deinem Level, mit echter Physik, Sprüngen und Schüssen.",
    "show2_li_1": "Als Tank, Damage oder Sniper testen",
    "show2_li_2": "Dieselbe Physik und Waffen wie in Cosmos Arena",
    "show2_li_3": "Anpassen im Flug: raus, ändern, zurück in den Kampf",
    "show2_shot_alt": "Test, dein eigenes Level spielen",
    "learn_kick": "Anleitungen",
    "learn_title": "In fünf Minuten kapiert",
    "learn_sub": "Drei Dinge, die du wissen musst, um dein erstes Level zu bauen und zu speichern.",
    "guide_1_tag": "Wo anfangen",
    "guide_1_title": "Bau die Geometrie",
    "guide_1_text": "Zieh einen Boden und ein paar Plattformen aus der Palette unten und setz einen Spawn. Der Editor zeigt dir sofort, wo ein Kämpfer durchkommt und wo nicht: grün geht, rot nicht.",
    "guide_2_tag": "Speichern",
    "guide_2_title": "Was drücken",
    "guide_2_text_1": "Das Level speichert sich selbst im Browser.",
    "guide_2_kbd_save": "Speichern",
    "guide_2_text_2": "legt es in deine Bibliothek,",
    "guide_2_kbd_export": "Exportieren",
    "guide_2_text_3": "lädt die Datei herunter,",
    "guide_2_kbd_share": "Teilen",
    "guide_2_text_4": "gibt dir einen Link zur Map.",
    "guide_3_tag": "Eigene Texturen",
    "guide_3_title": "Bild hochladen",
    "guide_3_text_1": "Wähl einen Block, öffne den Textur-Slot und drück",
    "guide_3_kbd_upload": "Eigene hochladen",
    "guide_3_text_2": "Das Bild legt sich auf die Fläche. Für ein fertiges Level leg die Datei ins Projekt und trag den Pfad ein, damit sie für immer bleibt.",
    "rewards_kick": "Belohnungen",
    "rewards_title": "Dein Level im Spiel, du wirst bezahlt",
    "rewards_sub": "Die besten Maps kommen in die gemeinsame Cosmos-Arena-Rotation. Für ein angenommenes Level zahlen wir dem Autor in USDT oder GRAM. Die Höhe hängt von der Qualität der Map ab und davon, wie oft sie gespielt wird.",
    "rstep_1_title": "Bauen und einreichen",
    "rstep_1_text": "Dein fertiges Level schickst du direkt aus dem Editor zum Review.",
    "rstep_2_title": "Ins Spiel geschafft",
    "rstep_2_text": "Es besteht das Review und kommt in die Rotation für alle Spieler.",
    "rstep_3_title": "Bezahlung kassieren",
    "rstep_3_text": "Die Belohnung kommt in USDT oder GRAM per Telegram.",
    "crit_1": "Für alle Rollen begehbar, grüne Anzeige",
    "crit_2": "Faire Symmetrie und angenehme Kämpfe",
    "crit_3": "Macht Spaß, dann bleibt die Map länger in Rotation",
    "coin_usdt_sub": "Stablecoin, Auszahlung aufs Wallet",
    "coin_gram_sub": "direkt in Telegram",
    "faq_kick": "Fragen",
    "faq_title": "Kurz das Wichtigste",
    "faq_free_q": "Ist das kostenlos?",
    "faq_free_a": "Ja. Der Editor öffnet sich im Browser, ohne Installation und ohne Bezahlung.",
    "faq_account_q": "Brauche ich einen Account?",
    "faq_account_a": "Nur zum Bauen nicht. Einen Account brauchst du erst, wenn du ein Level zum Review einreichen und eine Belohnung verdienen willst.",
    "faq_save_q": "Wo wird mein Level gespeichert?",
    "faq_save_a": "Automatisch im Browser. Du kannst es als Datei herunterladen oder einen Link teilen, damit es nicht verloren geht.",
    "faq_skill_q": "Was muss ich können?",
    "faq_skill_a": "Nichts. Du setzt Plattformen mit der Maus und der Editor zeigt dir, wo ein Kämpfer durchkommt.",
    "faq_engine_q": "Worauf läuft mein Level?",
    "faq_engine_a": "Auf derselben Engine wie Cosmos Arena, mit echter Physik und echten Waffen.",
    "faq_reward_q": "Wie bekomme ich eine Belohnung?",
    "faq_reward_a": "Bau ein Level und reich es zum Review ein. Schafft es ins Spiel, zahlen wir in USDT oder GRAM.",
    "game_kick": "Über das Spiel",
    "game_sub": "Eine lebendige 2.5D-PvP-Arena: 11 Helden und drei Rollen. Studio ist genau diese Engine, in deine Hand gelegt. Alles, was du baust, wird echt gespielt.",
    "stat_heroes": "Helden",
    "stat_roles": "Rollen: Tank, Damage, Sniper",
    "stat_engine": "Engine für Spiel und Editor",
    "stat_levels": "Level von Spielern",
    "final_kick": "Bereit?",
    "final_title": "Bau dein Level genau jetzt",
    "final_sub": "Öffnet sich im Browser. Kostenlos. Deine Kreation bleibt bei dir.",
    "final_undercta": "Kostenlos starten, ohne Installation, direkt im Browser",
    "feedback_kick": "Feedback",
    "feedback_title": "Idee, Frage oder einen Bug gefunden?",
    "feedback_sub": "Schreib uns direkt auf Telegram. Wir lesen alles und antworten.",
    "feedback_cta": "Auf Telegram schreiben",
    "footer_copy": "© 2026 Space Attack",
    "footer_support": "Support"
  },
  "fr": {
    "page_title": "Space Attack Studio - crée ton arène",
    "nav_feat": "Fonctions",
    "nav_rewards": "Récompenses",
    "nav_faq": "Questions",
    "nav_game": "Jeu",
    "nav_login": "Se connecter",
    "cta_build": "Créer un niveau",
    "hero_title_1": "Crée ton",
    "hero_title_2": "arène",
    "hero_lead": "Crée des niveaux pour Space Attack directement dans ton navigateur. Pose des plateformes, applique des textures, teste-les au combat et partage le lien. Tout ce que tu construis tourne sur le même moteur que Cosmos Arena.",
    "cta_how": "Comment ça marche",
    "hero_undercta": "Sans installation, gratuit, sauvegardé dans le navigateur",
    "hero_frame_alt": "Éditeur de niveaux Space Attack Studio",
    "badge_walkability": "Contrôle de praticabilité",
    "badge_textures": "Des textures sur chaque face",
    "badge_test": "Test en un clic",
    "badge_parallax": "Parallaxe et profondeur",
    "feat_kick": "Fonctions",
    "feat_title": "Ce que fait l'éditeur",
    "feat_sub": "Du premier bloc à une map jouable dans une seule fenêtre. Sans code.",
    "feat_1_title": "Pose des blocs et glisse sur la grille",
    "feat_1_text": "Plateformes, rampes, ponts, îles et points d'apparition. Déplace, change la largeur, tout s'aligne.",
    "feat_2_title": "Peins les faces avec des textures",
    "feat_2_text": "Des matériaux pour chaque côté d'un bloc et des styles prêts à l'emploi : station, mine, cristal, débris.",
    "feat_3_title": "Regarde sous tous les angles, même en fil de fer",
    "feat_3_text": "Vues de face, trois-quarts et de dessus. Fil de fer, couches de profondeur et parallaxe pour du volume.",
    "feat_4_title": "Joue directement dans l'éditeur",
    "feat_4_text": "Un clic et tu cours sur ta map avec une vraie physique, des sauts et des tirs.",
    "how_kick": "Comment ça marche",
    "how_title": "Quatre étapes vers ton arène",
    "step_1_title": "Esquisse",
    "step_1_text": "Lâche des plateformes et des spawns depuis la palette. La grille et l'alignement gardent la géométrie propre.",
    "step_2_title": "Textures",
    "step_2_text": "Choisis un style et peins les faces. Ajoute un fond pour la profondeur.",
    "step_3_title": "Joue",
    "step_3_text": "Appuie sur tester et vérifie ton niveau en vrai combat sur le même moteur.",
    "step_4_title": "Partage",
    "step_4_text": "Sauvegarde et envoie le lien. Les niveaux des autres sont à un clic.",
    "show1_kick": "Éditeur",
    "show1_title": "Construis en visuel, sans code",
    "show1_sub": "Sélectionne, déplace et redimensionne directement en 3D. Barre d'outils en haut, palette en bas, comme dans un vrai moteur.",
    "show1_li_1": "Gizmos de déplacement, rotation et échelle",
    "show1_li_2": "Alignement sur la grille au pas de 0.5",
    "show1_li_3": "Annuler et rétablir, doublons, couches de profondeur",
    "show1_li_4": "Vues : de face, trois-quarts, de dessus",
    "show1_shot_alt": "Éditeur, géométrie du niveau",
    "show2_kick": "Test",
    "show2_title": "Joue tout de suite ce que tu as construit",
    "show2_sub": "Pas d'export ni de build. Un clic et tu es dans ton niveau, avec une vraie physique, des sauts et des tirs.",
    "show2_li_1": "Teste en tank, dégâts ou sniper",
    "show2_li_2": "La même physique et les mêmes armes que Cosmos Arena",
    "show2_li_3": "Ajuste à la volée : tu sors, tu changes, tu repars au combat",
    "show2_shot_alt": "Test, en train de jouer ton propre niveau",
    "learn_kick": "Guides",
    "learn_title": "Compris en cinq minutes",
    "learn_sub": "Trois choses à savoir pour monter et sauvegarder ton premier niveau.",
    "guide_1_tag": "Par où commencer",
    "guide_1_title": "Monte la géométrie",
    "guide_1_text": "Lâche un sol et deux ou trois plateformes depuis la palette du bas, puis pose un spawn. L'éditeur montre aussitôt où un combattant passe et où il ne passe pas : vert oui, rouge non.",
    "guide_2_tag": "Sauvegarde",
    "guide_2_title": "Quoi cliquer",
    "guide_2_text_1": "Le niveau se sauvegarde tout seul dans le navigateur.",
    "guide_2_kbd_save": "Sauvegarder",
    "guide_2_text_2": "le met dans ta bibliothèque,",
    "guide_2_kbd_export": "Exporter",
    "guide_2_text_3": "télécharge le fichier,",
    "guide_2_kbd_share": "Partager",
    "guide_2_text_4": "te donne un lien vers la map.",
    "guide_3_tag": "Tes propres textures",
    "guide_3_title": "Envoie une image",
    "guide_3_text_1": "Choisis un bloc, ouvre l'emplacement de texture et clique",
    "guide_3_kbd_upload": "Envoyer la mienne",
    "guide_3_text_2": "L'image se pose sur la face. Pour un niveau final, mets le fichier dans le projet et indique le chemin pour qu'il reste pour toujours.",
    "rewards_kick": "Récompenses",
    "rewards_title": "Ton niveau dans le jeu, tu es payé",
    "rewards_sub": "Les meilleures maps entrent dans la rotation commune de Cosmos Arena. Pour un niveau accepté, on paie l'auteur en USDT ou GRAM. Le montant dépend de la qualité de la map et de la fréquence à laquelle on y joue.",
    "rstep_1_title": "Construis et envoie",
    "rstep_1_text": "Tu envoies ton niveau fini en review directement depuis l'éditeur.",
    "rstep_2_title": "Entré dans le jeu",
    "rstep_2_text": "Il passe la review et entre en rotation pour tous les joueurs.",
    "rstep_3_title": "Reçois le paiement",
    "rstep_3_text": "La récompense arrive en USDT ou GRAM sur Telegram.",
    "crit_1": "Praticable par tous les rôles, indicateur vert",
    "crit_2": "Symétrie équitable et combats agréables",
    "crit_3": "Fun à jouer, alors la map reste plus longtemps en rotation",
    "coin_usdt_sub": "stablecoin, retrait vers ton portefeuille",
    "coin_gram_sub": "directement dans Telegram",
    "faq_kick": "Questions",
    "faq_title": "L'essentiel en bref",
    "faq_free_q": "C'est gratuit ?",
    "faq_free_a": "Oui. L'éditeur s'ouvre dans le navigateur, sans installation ni paiement.",
    "faq_account_q": "Faut-il un compte ?",
    "faq_account_a": "Pour juste construire, non. Le compte n'est nécessaire que si tu veux envoyer un niveau en review et gagner une récompense.",
    "faq_save_q": "Où mon niveau est-il sauvegardé ?",
    "faq_save_a": "Dans le navigateur, automatiquement. Tu peux le télécharger en fichier ou partager un lien pour ne rien perdre.",
    "faq_skill_q": "Qu'est-ce qu'il faut savoir faire ?",
    "faq_skill_a": "Rien. Tu poses des plateformes à la souris et l'éditeur t'indique où un combattant passe.",
    "faq_engine_q": "Sur quoi tourne mon niveau ?",
    "faq_engine_a": "Sur le même moteur que Cosmos Arena, avec une vraie physique et de vraies armes.",
    "faq_reward_q": "Comment obtenir une récompense ?",
    "faq_reward_a": "Construis un niveau et envoie-le en review. S'il entre dans le jeu, on paie en USDT ou GRAM.",
    "game_kick": "À propos du jeu",
    "game_sub": "Une arène PvP 2.5D bien vivante : 11 héros et trois rôles. Studio, c'est ce même moteur, mis entre tes mains. Tout ce que tu construis se joue pour de vrai.",
    "stat_heroes": "héros",
    "stat_roles": "rôles : tank, dégâts, sniper",
    "stat_engine": "moteur pour le jeu et l'éditeur",
    "stat_levels": "niveaux créés par les joueurs",
    "final_kick": "Prêt ?",
    "final_title": "Monte ton niveau tout de suite",
    "final_sub": "S'ouvre dans le navigateur. Gratuit. Ta création reste avec toi.",
    "final_undercta": "Commence gratuitement, sans installation, directement dans ton navigateur",
    "feedback_kick": "Retour",
    "feedback_title": "Une idée, une question ou un bug repéré ?",
    "feedback_sub": "Écris-nous directement sur Telegram. On lit tout et on répond.",
    "feedback_cta": "Nous écrire sur Telegram",
    "footer_copy": "© 2026 Space Attack",
    "footer_support": "Support"
  },
  "it": {
    "page_title": "Space Attack Studio - crea la tua arena",
    "nav_feat": "Funzioni",
    "nav_rewards": "Ricompense",
    "nav_faq": "Domande",
    "nav_game": "Gioco",
    "nav_login": "Accedi",
    "cta_build": "Crea un livello",
    "hero_title_1": "Crea la tua",
    "hero_title_2": "arena",
    "hero_lead": "Crea livelli per Space Attack direttamente nel browser. Piazza piattaforme, applica texture, provale in combattimento e condividi il link. Tutto quello che costruisci gira sullo stesso motore di Cosmos Arena.",
    "cta_how": "Come funziona",
    "hero_undercta": "Senza installare, gratis, salvato nel browser",
    "hero_frame_alt": "Editor di livelli di Space Attack Studio",
    "badge_walkability": "Verifica di percorribilità",
    "badge_textures": "Texture su ogni faccia",
    "badge_test": "Test in un clic",
    "badge_parallax": "Parallasse e profondità",
    "feat_kick": "Funzioni",
    "feat_title": "Cosa sa fare l'editor",
    "feat_sub": "Dal primo blocco a una mappa giocabile in un'unica finestra. Senza codice.",
    "feat_1_title": "Piazza blocchi e trascina sulla griglia",
    "feat_1_text": "Piattaforme, rampe, ponti, isole e spawn. Spostali, cambia la larghezza, tutto si aggancia.",
    "feat_2_title": "Colora le facce con le texture",
    "feat_2_text": "Materiali per ogni lato del blocco e stili pronti: stazione, miniera, cristallo, detriti.",
    "feat_3_title": "Guarda da qualsiasi angolo, anche in wireframe",
    "feat_3_text": "Viste frontale, tre quarti e dall'alto. Wireframe, livelli di profondità e parallasse per dare volume.",
    "feat_4_title": "Gioca direttamente nell'editor",
    "feat_4_text": "Un clic e corri sulla tua mappa con fisica vera, salti e spari.",
    "how_kick": "Come funziona",
    "how_title": "Quattro passi verso la tua arena",
    "step_1_title": "Abbozza",
    "step_1_text": "Butta giù piattaforme e spawn dalla palette. Griglia e aggancio tengono la geometria pulita.",
    "step_2_title": "Texture",
    "step_2_text": "Scegli uno stile e colora le facce. Aggiungi uno sfondo per la profondità.",
    "step_3_title": "Gioca",
    "step_3_text": "Premi prova e controlla il tuo livello in combattimento vero sullo stesso motore.",
    "step_4_title": "Condividi",
    "step_4_text": "Salva e manda il link. I livelli degli altri sono a un clic.",
    "show1_kick": "Editor",
    "show1_title": "Costruisci in visuale, senza codice",
    "show1_sub": "Seleziona, sposta e ridimensiona direttamente in 3D. Barra in alto, palette in basso, come in un motore vero.",
    "show1_li_1": "Gizmo di spostamento, rotazione e scala",
    "show1_li_2": "Aggancio alla griglia con passo 0.5",
    "show1_li_3": "Annulla e ripeti, duplicati, livelli di profondità",
    "show1_li_4": "Viste: frontale, tre quarti, dall'alto",
    "show1_shot_alt": "Editor, geometria del livello",
    "show2_kick": "Test",
    "show2_title": "Gioca subito quello che hai costruito",
    "show2_sub": "Niente export né build. Un clic e sei dentro il tuo livello, con fisica vera, salti e spari.",
    "show2_li_1": "Prova da tank, danno o sniper",
    "show2_li_2": "La stessa fisica e le stesse armi di Cosmos Arena",
    "show2_li_3": "Modifica al volo: esci, cambi, torni in battaglia",
    "show2_shot_alt": "Test, mentre giochi il tuo livello",
    "learn_kick": "Guide",
    "learn_title": "Lo capisci in cinque minuti",
    "learn_sub": "Tre cose da sapere per montare e salvare il tuo primo livello.",
    "guide_1_tag": "Da dove iniziare",
    "guide_1_title": "Monta la geometria",
    "guide_1_text": "Butta giù un pavimento e un paio di piattaforme dalla palette in basso e metti uno spawn. L'editor evidenzia subito dove passa un combattente e dove no: verde sì, rosso no.",
    "guide_2_tag": "Salvataggio",
    "guide_2_title": "Cosa premere",
    "guide_2_text_1": "Il livello si salva da solo nel browser.",
    "guide_2_kbd_save": "Salva",
    "guide_2_text_2": "lo mette nella tua libreria,",
    "guide_2_kbd_export": "Esporta",
    "guide_2_text_3": "scarica il file,",
    "guide_2_kbd_share": "Condividi",
    "guide_2_text_4": "ti dà un link alla mappa.",
    "guide_3_tag": "Le tue texture",
    "guide_3_title": "Carica un'immagine",
    "guide_3_text_1": "Scegli un blocco, apri lo slot texture e premi",
    "guide_3_kbd_upload": "Carica la tua",
    "guide_3_text_2": "L'immagine si posa sulla faccia. Per un livello finito, metti il file nel progetto e scrivi il percorso così resta per sempre.",
    "rewards_kick": "Ricompense",
    "rewards_title": "Il tuo livello nel gioco, tu vieni pagato",
    "rewards_sub": "Le mappe migliori entrano nella rotazione comune di Cosmos Arena. Per un livello accettato paghiamo l'autore in USDT o GRAM. L'importo dipende dalla qualità della mappa e da quanto ci si gioca.",
    "rstep_1_title": "Costruisci e invia",
    "rstep_1_text": "Mandi il tuo livello finito in revisione direttamente dall'editor.",
    "rstep_2_title": "Entrato nel gioco",
    "rstep_2_text": "Supera la revisione ed entra in rotazione per tutti i giocatori.",
    "rstep_3_title": "Ricevi il pagamento",
    "rstep_3_text": "La ricompensa arriva in USDT o GRAM su Telegram.",
    "crit_1": "Percorribile da tutti i ruoli, indicatore verde",
    "crit_2": "Simmetria equa e combattimenti comodi",
    "crit_3": "Divertente da giocare, così la mappa resta più a lungo in rotazione",
    "coin_usdt_sub": "stablecoin, prelievo sul wallet",
    "coin_gram_sub": "direttamente in Telegram",
    "faq_kick": "Domande",
    "faq_title": "L'essenziale in breve",
    "faq_free_q": "È gratis?",
    "faq_free_a": "Sì. L'editor si apre nel browser, senza installazione e senza pagamento.",
    "faq_account_q": "Serve un account?",
    "faq_account_a": "Solo per costruire, no. L'account serve solo se vuoi mandare un livello in revisione e ricevere una ricompensa.",
    "faq_save_q": "Dove si salva il livello?",
    "faq_save_a": "Nel browser, in automatico. Puoi scaricarlo come file o condividere un link per non perderlo.",
    "faq_skill_q": "Cosa devo saper fare?",
    "faq_skill_a": "Niente. Piazzi le piattaforme col mouse e l'editor ti dice dove passa un combattente.",
    "faq_engine_q": "Su cosa gira il mio livello?",
    "faq_engine_a": "Sullo stesso motore di Cosmos Arena, con fisica e armi vere.",
    "faq_reward_q": "Come ottengo la ricompensa?",
    "faq_reward_a": "Costruisci un livello e mandalo in revisione. Se entra nel gioco, paghiamo in USDT o GRAM.",
    "game_kick": "Sul gioco",
    "game_sub": "Un'arena PvP 2.5D viva: 11 eroi e tre ruoli. Studio è quello stesso motore, messo nelle tue mani. Tutto quello che costruisci si gioca davvero.",
    "stat_heroes": "eroi",
    "stat_roles": "ruoli: tank, danno, sniper",
    "stat_engine": "motore per il gioco e l'editor",
    "stat_levels": "livelli fatti dai giocatori",
    "final_kick": "Pronto?",
    "final_title": "Monta il tuo livello proprio adesso",
    "final_sub": "Si apre nel browser. Gratis. La tua creazione resta con te.",
    "final_undercta": "Inizia gratis, senza installare, direttamente nel browser",
    "feedback_kick": "Feedback",
    "feedback_title": "Hai un'idea, una domanda o hai trovato un bug?",
    "feedback_sub": "Scrivici direttamente su Telegram. Leggiamo tutto e rispondiamo.",
    "feedback_cta": "Scrivici su Telegram",
    "footer_copy": "© 2026 Space Attack",
    "footer_support": "Supporto"
  },
  "tr": {
    "page_title": "Space Attack Studio - kendi arenanı kur",
    "nav_feat": "Özellikler",
    "nav_rewards": "Ödüller",
    "nav_faq": "Sorular",
    "nav_game": "Oyun",
    "nav_login": "Giriş yap",
    "cta_build": "Bölüm oluştur",
    "hero_title_1": "Kendi",
    "hero_title_2": "arenanı kur",
    "hero_lead": "Space Attack için bölümleri doğrudan tarayıcında tasarla. Platformları yerleştir, dokuları boya, savaşta test et ve linki paylaş. Kurduğun her şey Cosmos Arena ile aynı motorda çalışır.",
    "cta_how": "Nasıl çalışır",
    "hero_undercta": "Kurulum yok, ücretsiz, tarayıcıda kayıtlı",
    "hero_frame_alt": "Space Attack Studio bölüm editörü",
    "badge_walkability": "Geçilebilirlik kontrolü",
    "badge_textures": "Her yüzeye doku",
    "badge_test": "Tek tıkla test",
    "badge_parallax": "Parallaks ve derinlik",
    "feat_kick": "Özellikler",
    "feat_title": "Editör neler yapıyor",
    "feat_sub": "İlk bloktan oynanabilir haritaya tek pencerede. Kod yok.",
    "feat_1_title": "Blokları yerleştir, ızgaraya oturt",
    "feat_1_text": "Platformlar, rampalar, köprüler, adalar ve doğuş noktaları. Taşı, genişliği değiştir, hepsi kendiliğinden hizalanır.",
    "feat_2_title": "Yüzeyleri dokularla boya",
    "feat_2_text": "Bloğun her yüzü için malzemeler ve hazır stiller: istasyon, maden, kristal, enkaz.",
    "feat_3_title": "Her açıdan bak, tel kafeste bile",
    "feat_3_text": "Önden, dörtte üç ve üstten görünümler. Tel kafes, derinlik katmanları ve hacim için parallaks.",
    "feat_4_title": "Doğrudan editörde oyna",
    "feat_4_text": "Tek tık ve gerçek fizik, zıplama ve ateşle kendi haritanda koşuyorsun.",
    "how_kick": "Nasıl çalışır",
    "how_title": "Kendi arenana dört adım",
    "step_1_title": "Taslak çiz",
    "step_1_text": "Paletten platformları ve doğuş noktalarını bırak. Izgara ve hizalama geometriyi düzgün tutar.",
    "step_2_title": "Dokular",
    "step_2_text": "Bir stil seç ve yüzeyleri boya. Derinlik için bir arka plan ekle.",
    "step_3_title": "Oyna",
    "step_3_text": "Teste bas ve bölümünü aynı motorda gerçek savaşta dene.",
    "step_4_title": "Paylaş",
    "step_4_text": "Kaydet ve linki gönder. Başkalarının bölümleri tek tık uzakta.",
    "show1_kick": "Editör",
    "show1_title": "Görsel olarak kur, kodsuz",
    "show1_sub": "Doğrudan 3D'de seç, taşı, boyutlandır. Üstte araç çubuğu, altta palet, gerçek bir motordaki gibi.",
    "show1_li_1": "Taşıma, döndürme ve ölçekleme gizmoları",
    "show1_li_2": "0.5 adımla ızgaraya oturma",
    "show1_li_3": "Geri al ve yinele, kopyalar, derinlik katmanları",
    "show1_li_4": "Görünümler: önden, dörtte üç, üstten",
    "show1_shot_alt": "Editör, bölüm geometrisi",
    "show2_kick": "Test",
    "show2_title": "Kurduğunu hemen oyna",
    "show2_sub": "Dışa aktarma ya da derleme yok. Tek tık ve gerçek fizik, zıplama ve ateşle bölümünün içindesin.",
    "show2_li_1": "Tank, hasar ya da keskin nişancı olarak test et",
    "show2_li_2": "Cosmos Arena ile aynı fizik ve silahlar",
    "show2_li_3": "Anında düzenle: çık, değiştir, savaşa geri dön",
    "show2_shot_alt": "Test, kendi bölümünü oynarken",
    "learn_kick": "Rehberler",
    "learn_title": "Beş dakikada çözersin",
    "learn_sub": "İlk bölümünü kurup kaydetmek için bilmen gereken üç şey.",
    "guide_1_tag": "Nereden başlamalı",
    "guide_1_title": "Geometriyi kur",
    "guide_1_text": "Alttaki paletten bir zemin ve birkaç platform bırak, bir doğuş noktası koy. Editör bir savaşçının nereden geçtiğini nereden geçemediğini anında gösterir: yeşil olur, kırmızı olmaz.",
    "guide_2_tag": "Kaydetme",
    "guide_2_title": "Neye basmalı",
    "guide_2_text_1": "Bölüm tarayıcıda kendiliğinden kaydedilir.",
    "guide_2_kbd_save": "Kaydet",
    "guide_2_text_2": "onu kitaplığına koyar,",
    "guide_2_kbd_export": "Dışa aktar",
    "guide_2_text_3": "dosyayı indirir,",
    "guide_2_kbd_share": "Paylaş",
    "guide_2_text_4": "haritaya bir link verir.",
    "guide_3_tag": "Kendi dokuların",
    "guide_3_title": "Bir görsel yükle",
    "guide_3_text_1": "Bir blok seç, doku yuvasını aç ve bas",
    "guide_3_kbd_upload": "Kendimi yükle",
    "guide_3_text_2": "Görsel yüzeye oturur. Bitmiş bir bölüm için dosyayı projeye koy ve yolu yaz ki sonsuza dek kalsın.",
    "rewards_kick": "Ödüller",
    "rewards_title": "Bölümün oyunda, sen para kazanırsın",
    "rewards_sub": "En iyi haritalar Cosmos Arena'nın ortak rotasyonuna girer. Kabul edilen bir bölüm için yazarına USDT ya da GRAM öderiz. Miktar haritanın kalitesine ve ne sıklıkta oynandığına bağlıdır.",
    "rstep_1_title": "Kur ve gönder",
    "rstep_1_text": "Bitmiş bölümünü doğrudan editörden incelemeye gönderirsin.",
    "rstep_2_title": "Oyuna girdi",
    "rstep_2_text": "İncelemeyi geçer ve tüm oyuncular için rotasyona girer.",
    "rstep_3_title": "Ödemeni al",
    "rstep_3_text": "Ödül USDT ya da GRAM olarak Telegram'a gelir.",
    "crit_1": "Tüm rollerle geçilebilir, yeşil gösterge",
    "crit_2": "Adil simetri ve rahat çatışmalar",
    "crit_3": "Oynaması keyifli, böylece harita rotasyonda daha uzun kalır",
    "coin_usdt_sub": "stablecoin, cüzdana çekim",
    "coin_gram_sub": "doğrudan Telegram'da",
    "faq_kick": "Sorular",
    "faq_title": "Kısaca en önemlisi",
    "faq_free_q": "Ücretsiz mi?",
    "faq_free_a": "Evet. Editör tarayıcıda açılır, kurulum yok, ödeme yok.",
    "faq_account_q": "Hesap gerekli mi?",
    "faq_account_a": "Sadece kurmak için hayır. Hesap yalnızca bir bölümü incelemeye gönderip ödül kazanmak istersen gerekir.",
    "faq_save_q": "Bölüm nereye kaydedilir?",
    "faq_save_a": "Otomatik olarak tarayıcıya. Kaybetmemek için dosya olarak indirebilir ya da link paylaşabilirsin.",
    "faq_skill_q": "Ne bilmem gerekiyor?",
    "faq_skill_a": "Hiçbir şey. Platformları fareyle koyarsın, editör savaşçının nereden geçeceğini söyler.",
    "faq_engine_q": "Bölümüm neyde çalışıyor?",
    "faq_engine_a": "Cosmos Arena ile aynı motorda, gerçek fizik ve silahlarla.",
    "faq_reward_q": "Ödülü nasıl alırım?",
    "faq_reward_a": "Bir bölüm kur ve incelemeye gönder. Oyuna girerse USDT ya da GRAM öderiz.",
    "game_kick": "Oyun hakkında",
    "game_sub": "Capcanlı bir 2.5D PvP arenası: 11 kahraman ve üç rol. Studio, aynı motorun sana verilmiş hali. Kurduğun her şey gerçekten oynanır.",
    "stat_heroes": "kahraman",
    "stat_roles": "rol: tank, hasar, keskin nişancı",
    "stat_engine": "oyun ve editör için tek motor",
    "stat_levels": "oyuncu yapımı bölüm",
    "final_kick": "Hazır mısın?",
    "final_title": "Bölümünü hemen şimdi kur",
    "final_sub": "Tarayıcıda açılır. Ücretsiz. Yarattığın şey seninle kalır.",
    "final_undercta": "Ücretsiz başla, kurulum yok, doğrudan tarayıcında",
    "feedback_kick": "Geri bildirim",
    "feedback_title": "Bir fikrin, sorun ya da bulduğun bir hata mı var?",
    "feedback_sub": "Bize doğrudan Telegram'dan yaz. Hepsini okur, cevap veririz.",
    "feedback_cta": "Telegram'dan yaz",
    "footer_copy": "© 2026 Space Attack",
    "footer_support": "Destek"
  },
  "id": {
    "page_title": "Space Attack Studio - bangun arena kamu sendiri",
    "nav_feat": "Fitur",
    "nav_rewards": "Hadiah",
    "nav_faq": "Pertanyaan",
    "nav_game": "Game",
    "nav_login": "Masuk",
    "cta_build": "Bangun level",
    "hero_title_1": "Bangun",
    "hero_title_2": "arena kamu",
    "hero_lead": "Rancang level untuk Space Attack langsung di browser. Pasang platform, kasih tekstur, uji di pertarungan, dan bagikan link. Semua yang kamu bangun jalan di engine yang sama dengan Cosmos Arena.",
    "cta_how": "Cara kerjanya",
    "hero_undercta": "Tanpa instal, gratis, tersimpan di browser",
    "hero_frame_alt": "Editor level Space Attack Studio",
    "badge_walkability": "Cek jalur lewat",
    "badge_textures": "Tekstur di tiap sisi",
    "badge_test": "Uji sekali klik",
    "badge_parallax": "Parallax dan kedalaman",
    "feat_kick": "Fitur",
    "feat_title": "Yang bisa dilakukan editor",
    "feat_sub": "Dari blok pertama sampai map yang bisa dimainkan dalam satu jendela. Tanpa kode.",
    "feat_1_title": "Pasang blok, tarik di grid",
    "feat_1_text": "Platform, ramp, jembatan, pulau, dan titik spawn. Geser, ubah lebar, semuanya nempel ke grid.",
    "feat_2_title": "Warnai sisi dengan tekstur",
    "feat_2_text": "Material untuk tiap sisi blok plus gaya siap pakai: stasiun, tambang, kristal, reruntuhan.",
    "feat_3_title": "Lihat dari sudut mana pun, bahkan wireframe",
    "feat_3_text": "Tampilan depan, tiga perempat, dan atas. Wireframe, lapisan kedalaman, dan parallax biar berdimensi.",
    "feat_4_title": "Main langsung di editor",
    "feat_4_text": "Sekali klik dan kamu sudah lari di map sendiri dengan fisika nyata, lompatan, dan tembakan.",
    "how_kick": "Cara kerjanya",
    "how_title": "Empat langkah menuju arena kamu",
    "step_1_title": "Sketsa",
    "step_1_text": "Jatuhkan platform dan spawn dari palet. Grid dan snap menjaga geometri tetap rapi.",
    "step_2_title": "Tekstur",
    "step_2_text": "Pilih gaya dan warnai sisi-sisinya. Tambah latar buat kedalaman.",
    "step_3_title": "Main",
    "step_3_text": "Tekan uji dan cek level kamu di pertarungan nyata pada engine yang sama.",
    "step_4_title": "Bagikan",
    "step_4_text": "Simpan dan kirim link. Level orang lain cuma sekali klik.",
    "show1_kick": "Editor",
    "show1_title": "Bangun secara visual, tanpa kode",
    "show1_sub": "Pilih, geser, dan ubah ukuran langsung di 3D. Toolbar di atas, palet di bawah, seperti engine sungguhan.",
    "show1_li_1": "Gizmo geser, putar, dan skala",
    "show1_li_2": "Snap ke grid dengan langkah 0.5",
    "show1_li_3": "Undo dan redo, duplikat, lapisan kedalaman",
    "show1_li_4": "Tampilan: depan, tiga perempat, atas",
    "show1_shot_alt": "Editor, geometri level",
    "show2_kick": "Uji",
    "show2_title": "Langsung main apa yang kamu bangun",
    "show2_sub": "Tanpa ekspor atau build. Sekali klik dan kamu sudah di dalam level, dengan fisika nyata, lompatan, dan tembakan.",
    "show2_li_1": "Uji sebagai tank, damage, atau sniper",
    "show2_li_2": "Fisika dan senjata yang sama dengan Cosmos Arena",
    "show2_li_3": "Ubah sambil jalan: keluar, ganti, balik bertarung",
    "show2_shot_alt": "Uji, memainkan level kamu sendiri",
    "learn_kick": "Panduan",
    "learn_title": "Paham dalam lima menit",
    "learn_sub": "Tiga hal yang perlu kamu tahu untuk membuat dan menyimpan level pertama.",
    "guide_1_tag": "Mulai dari mana",
    "guide_1_title": "Susun geometrinya",
    "guide_1_text": "Jatuhkan lantai dan beberapa platform dari palet di bawah, lalu taruh spawn. Editor langsung menandai di mana petarung bisa lewat dan di mana tidak: hijau bisa, merah tidak.",
    "guide_2_tag": "Menyimpan",
    "guide_2_title": "Tekan yang mana",
    "guide_2_text_1": "Level tersimpan sendiri di browser.",
    "guide_2_kbd_save": "Simpan",
    "guide_2_text_2": "menaruhnya di pustaka kamu,",
    "guide_2_kbd_export": "Ekspor",
    "guide_2_text_3": "mengunduh filenya,",
    "guide_2_kbd_share": "Bagikan",
    "guide_2_text_4": "memberi link ke map.",
    "guide_3_tag": "Tekstur sendiri",
    "guide_3_title": "Unggah gambar",
    "guide_3_text_1": "Pilih blok, buka slot tekstur, dan tekan",
    "guide_3_kbd_upload": "Unggah punyaku",
    "guide_3_text_2": "Gambar akan menempel di sisi itu. Untuk level final, taruh file di proyek dan tulis path-nya biar tersimpan selamanya.",
    "rewards_kick": "Hadiah",
    "rewards_title": "Level kamu di game, kamu dibayar",
    "rewards_sub": "Map terbaik masuk ke rotasi bersama Cosmos Arena. Untuk level yang diterima, kami bayar pembuatnya dalam USDT atau GRAM. Jumlahnya tergantung kualitas map dan seberapa sering dimainkan.",
    "rstep_1_title": "Bangun dan kirim",
    "rstep_1_text": "Kamu kirim level yang sudah jadi untuk ditinjau langsung dari editor.",
    "rstep_2_title": "Masuk ke game",
    "rstep_2_text": "Lolos tinjauan dan masuk rotasi untuk semua pemain.",
    "rstep_3_title": "Terima bayaran",
    "rstep_3_text": "Hadiah datang dalam USDT atau GRAM lewat Telegram.",
    "crit_1": "Bisa dilalui semua peran, indikator hijau",
    "crit_2": "Simetri yang adil dan pertarungan yang nyaman",
    "crit_3": "Seru dimainkan, jadi map bertahan lebih lama di rotasi",
    "coin_usdt_sub": "stablecoin, tarik ke dompet",
    "coin_gram_sub": "langsung di Telegram",
    "faq_kick": "Pertanyaan",
    "faq_title": "Intinya singkat",
    "faq_free_q": "Gratis?",
    "faq_free_a": "Ya. Editor terbuka di browser, tanpa instal dan tanpa bayar.",
    "faq_account_q": "Perlu akun?",
    "faq_account_a": "Kalau cuma bangun, tidak. Akun baru perlu kalau kamu mau kirim level untuk ditinjau dan dapat hadiah.",
    "faq_save_q": "Level tersimpan di mana?",
    "faq_save_a": "Di browser secara otomatis. Bisa diunduh sebagai file atau dibagikan lewat link biar tidak hilang.",
    "faq_skill_q": "Perlu bisa apa?",
    "faq_skill_a": "Tidak perlu apa-apa. Kamu pasang platform pakai mouse, editor yang kasih tahu di mana petarung bisa lewat.",
    "faq_engine_q": "Level saya jalan di apa?",
    "faq_engine_a": "Di engine yang sama dengan Cosmos Arena, dengan fisika dan senjata sungguhan.",
    "faq_reward_q": "Bagaimana cara dapat hadiah?",
    "faq_reward_a": "Bangun level dan kirim untuk ditinjau. Kalau masuk game, kami bayar dalam USDT atau GRAM.",
    "game_kick": "Tentang game",
    "game_sub": "Arena PvP 2.5D yang hidup: 11 hero dan tiga peran. Studio adalah engine yang sama, diserahkan ke tanganmu. Semua yang kamu bangun benar-benar dimainkan.",
    "stat_heroes": "hero",
    "stat_roles": "peran: tank, damage, sniper",
    "stat_engine": "engine untuk game dan editor",
    "stat_levels": "level buatan pemain",
    "final_kick": "Siap?",
    "final_title": "Bangun level kamu sekarang juga",
    "final_sub": "Terbuka di browser. Gratis. Karyamu tetap jadi milikmu.",
    "final_undercta": "Mulai gratis, tanpa instal, langsung di browser",
    "feedback_kick": "Masukan",
    "feedback_title": "Punya ide, pertanyaan, atau menemukan bug?",
    "feedback_sub": "Chat kami langsung di Telegram. Kami baca semua dan balas.",
    "feedback_cta": "Chat di Telegram",
    "footer_copy": "© 2026 Space Attack",
    "footer_support": "Dukungan"
  },
  "ja": {
    "page_title": "Space Attack Studio - 自分だけのアリーナを作ろう",
    "nav_feat": "機能",
    "nav_rewards": "報酬",
    "nav_faq": "よくある質問",
    "nav_game": "ゲーム",
    "nav_login": "ログイン",
    "cta_build": "レベルを作る",
    "hero_title_1": "自分だけの",
    "hero_title_2": "アリーナ",
    "hero_lead": "ブラウザだけで Space Attack のレベルを作れる。足場を置いて、テクスチャを塗って、実戦でテストして、リンクで共有。作ったものはすべて Cosmos Arena と同じエンジンで動く。",
    "cta_how": "使い方",
    "hero_undercta": "インストール不要、無料、ブラウザに保存",
    "hero_frame_alt": "Space Attack Studio レベルエディター",
    "badge_walkability": "移動可否チェック",
    "badge_textures": "全面テクスチャ",
    "badge_test": "ワンクリックテスト",
    "badge_parallax": "パララックスと奥行き",
    "feat_kick": "機能",
    "feat_title": "エディターでできること",
    "feat_sub": "最初のブロックから遊べるマップまで、1つの画面で。コードは不要。",
    "feat_1_title": "ブロックを置いてグリッドにスナップ",
    "feat_1_text": "足場、スロープ、橋、島、スポーン地点。動かして幅を変えて、すべてピタッとスナップ。",
    "feat_2_title": "面をテクスチャで塗る",
    "feat_2_text": "ブロックのどの面にも使えるマテリアルと、すぐ使えるスタイル。ステーション、鉱山、クリスタル、瓦礫。",
    "feat_3_title": "どの角度からでも、ワイヤーフレームでも確認",
    "feat_3_text": "正面、斜め、真上のビュー。ワイヤーフレーム、奥行きレイヤー、パララックスで立体感を出せる。",
    "feat_4_title": "エディターの中でそのまま遊ぶ",
    "feat_4_text": "ワンクリックで、リアルな物理・ジャンプ・射撃つきの自作マップを走り回れる。",
    "how_kick": "使い方",
    "how_title": "自分のアリーナまで4ステップ",
    "step_1_title": "ラフを描く",
    "step_1_text": "パレットから足場とスポーンを置くだけ。グリッドとスナップが形をきれいに保つ。",
    "step_2_title": "テクスチャ",
    "step_2_text": "スタイルを選んで面を塗る。背景を足して奥行きを出そう。",
    "step_3_title": "遊ぶ",
    "step_3_text": "テストを押せば、同じエンジンの実戦で自分のレベルをチェックできる。",
    "step_4_title": "共有",
    "step_4_text": "保存してリンクを送るだけ。他のプレイヤーのレベルもワンクリックで。",
    "show1_kick": "エディター",
    "show1_title": "コードなしで、見たまま作る",
    "show1_sub": "3D上で直接、選んで・動かして・サイズ変更。上にツールバー、下にパレット。まるで本物のエンジン。",
    "show1_li_1": "移動・回転・スケールのギズモ",
    "show1_li_2": "0.5刻みのグリッドスナップ",
    "show1_li_3": "元に戻す・やり直し、複製、奥行きレイヤー",
    "show1_li_4": "ビュー: 正面、斜め、真上",
    "show1_shot_alt": "エディター、レベルの形状",
    "show2_kick": "テスト",
    "show2_title": "作ったものを、その場でプレイ",
    "show2_sub": "エクスポートもビルドも不要。ワンクリックで、リアルな物理・ジャンプ・射撃つきの自分のレベルの中へ。",
    "show2_li_1": "タンク、ダメージ、スナイパーでテスト",
    "show2_li_2": "Cosmos Arena と同じ物理と武器",
    "show2_li_3": "その場で調整。抜けて、変えて、また戦いへ。",
    "show2_shot_alt": "テスト、自作レベルをプレイ中",
    "learn_kick": "ガイド",
    "learn_title": "5分でわかる",
    "learn_sub": "最初のレベルを作って保存するために知っておきたい3つ。",
    "guide_1_tag": "まずここから",
    "guide_1_title": "形を組む",
    "guide_1_text": "下のパレットから床と足場をいくつか置いて、スポーンを配置。ファイターが通れる場所と通れない場所をエディターがすぐに色分け。緑はOK、赤はNG。",
    "guide_2_tag": "保存",
    "guide_2_title": "押すボタン",
    "guide_2_text_1": "レベルはブラウザに自動保存される。",
    "guide_2_kbd_save": "保存",
    "guide_2_text_2": "でライブラリに入り、",
    "guide_2_kbd_export": "エクスポート",
    "guide_2_text_3": "でファイルをダウンロード、",
    "guide_2_kbd_share": "共有",
    "guide_2_text_4": "でマップのリンクが手に入る。",
    "guide_3_tag": "自分だけのテクスチャ",
    "guide_3_title": "画像をアップロード",
    "guide_3_text_1": "ブロックを選んでテクスチャスロットを開き、",
    "guide_3_kbd_upload": "自分のをアップ",
    "guide_3_text_2": "を押す。画像が面に貼られる。完成レベルなら、ファイルをプロジェクトに入れてパスを書けば、ずっと残る。",
    "rewards_kick": "報酬",
    "rewards_title": "あなたのレベルがゲームに、そして報酬に",
    "rewards_sub": "優れたマップは Cosmos Arena 共通のローテーションに採用。採用されたレベルには作者へ USDT または GRAM を支払う。金額はマップの質と、どれだけ遊ばれるかで決まる。",
    "rstep_1_title": "作って送る",
    "rstep_1_text": "完成したレベルを、エディターからそのままレビューに送る。",
    "rstep_2_title": "ゲームに採用",
    "rstep_2_text": "レビューを通過して、全プレイヤー向けのローテーション入り。",
    "rstep_3_title": "報酬を受け取る",
    "rstep_3_text": "報酬は Telegram で USDT または GRAM で届く。",
    "crit_1": "全ロールが通れる、インジケーターは緑",
    "crit_2": "フェアな対称性と、気持ちいい戦い",
    "crit_3": "遊んで楽しい。だからマップは長くローテーションに残る",
    "coin_usdt_sub": "ステーブルコイン、ウォレットへ出金",
    "coin_gram_sub": "Telegram でそのまま",
    "faq_kick": "よくある質問",
    "faq_title": "要点だけ",
    "faq_free_q": "無料ですか?",
    "faq_free_a": "はい。エディターはブラウザで開くだけ。インストールも支払いも不要。",
    "faq_account_q": "アカウントは必要?",
    "faq_account_a": "作るだけなら不要。アカウントが要るのは、レベルをレビューに送って報酬をもらいたいときだけ。",
    "faq_save_q": "レベルはどこに保存される?",
    "faq_save_a": "ブラウザに自動で。ファイルとしてダウンロードしたり、リンクで共有したりすれば、なくす心配なし。",
    "faq_skill_q": "何ができればいい?",
    "faq_skill_a": "何もいらない。マウスで足場を置けば、ファイターが通れる場所をエディターが教えてくれる。",
    "faq_engine_q": "自分のレベルは何で動く?",
    "faq_engine_a": "Cosmos Arena と同じエンジン。物理も武器も本物。",
    "faq_reward_q": "報酬はどうやってもらう?",
    "faq_reward_a": "レベルを作ってレビューに送るだけ。ゲームに採用されたら USDT または GRAM で支払う。",
    "game_kick": "ゲームについて",
    "game_sub": "生きた2.5D PvP アリーナ。11人のヒーローと3つのロール。Studio はそのエンジンをそのまま君の手に。作ったものは、すべて本気で遊べる。",
    "stat_heroes": "ヒーロー",
    "stat_roles": "ロール: タンク、ダメージ、スナイパー",
    "stat_engine": "ゲームとエディターのエンジン",
    "stat_levels": "プレイヤー製レベル",
    "final_kick": "準備OK?",
    "final_title": "今すぐレベルを作ろう",
    "final_sub": "ブラウザで開くだけ。無料。作ったものは、ずっと君のもの。",
    "final_undercta": "無料でスタート、インストール不要、ブラウザですぐに",
    "feedback_kick": "フィードバック",
    "feedback_title": "アイデア、質問、バグを見つけた?",
    "feedback_sub": "Telegram で直接どうぞ。全部読んで、返信します。",
    "feedback_cta": "Telegram で連絡",
    "footer_copy": "© 2026 Space Attack",
    "footer_support": "サポート"
  },
  "ko": {
    "page_title": "Space Attack Studio - 나만의 아레나를 만들자",
    "nav_feat": "기능",
    "nav_rewards": "보상",
    "nav_faq": "자주 묻는 질문",
    "nav_game": "게임",
    "nav_login": "로그인",
    "cta_build": "레벨 만들기",
    "hero_title_1": "나만의",
    "hero_title_2": "아레나",
    "hero_lead": "브라우저에서 바로 Space Attack 레벨을 만들자. 플랫폼을 놓고, 텍스처를 입히고, 실전에서 테스트하고, 링크로 공유. 만든 건 전부 Cosmos Arena와 같은 엔진에서 돌아간다.",
    "cta_how": "사용법",
    "hero_undercta": "설치 없이, 무료로, 브라우저에 저장",
    "hero_frame_alt": "Space Attack Studio 레벨 에디터",
    "badge_walkability": "이동 가능 여부 체크",
    "badge_textures": "모든 면에 텍스처",
    "badge_test": "원클릭 테스트",
    "badge_parallax": "패럴랙스와 깊이감",
    "feat_kick": "기능",
    "feat_title": "에디터로 할 수 있는 것",
    "feat_sub": "첫 블록부터 플레이 가능한 맵까지, 창 하나에서. 코드는 필요 없다.",
    "feat_1_title": "블록을 놓고 그리드에 스냅",
    "feat_1_text": "플랫폼, 램프, 다리, 섬, 스폰 지점. 옮기고 폭을 바꿔도 전부 착 붙는다.",
    "feat_2_title": "면을 텍스처로 칠하기",
    "feat_2_text": "블록의 모든 면에 쓰는 머티리얼과 바로 쓰는 스타일. 스테이션, 광산, 크리스털, 잔해.",
    "feat_3_title": "어느 각도에서든, 와이어프레임으로도 확인",
    "feat_3_text": "정면, 3/4, 위에서 보는 뷰. 와이어프레임, 깊이 레이어, 패럴랙스로 진짜 입체감을.",
    "feat_4_title": "에디터 안에서 바로 플레이",
    "feat_4_text": "클릭 한 번이면 실제 물리, 점프, 사격이 담긴 내 맵을 뛰어다닌다.",
    "how_kick": "사용법",
    "how_title": "내 아레나까지 네 단계",
    "step_1_title": "스케치",
    "step_1_text": "팔레트에서 플랫폼과 스폰을 놓기만. 그리드와 스냅이 지오메트리를 깔끔하게 잡아준다.",
    "step_2_title": "텍스처",
    "step_2_text": "스타일을 고르고 면을 칠하자. 배경을 더해 깊이감을 살린다.",
    "step_3_title": "플레이",
    "step_3_text": "테스트를 누르면 같은 엔진의 실전에서 내 레벨을 확인할 수 있다.",
    "step_4_title": "공유",
    "step_4_text": "저장하고 링크를 보내면 끝. 다른 플레이어의 레벨도 클릭 한 번.",
    "show1_kick": "에디터",
    "show1_title": "코드 없이, 보이는 대로 만들기",
    "show1_sub": "3D에서 바로 선택하고, 옮기고, 크기 조절. 위엔 툴바, 아래엔 팔레트. 진짜 엔진처럼.",
    "show1_li_1": "이동, 회전, 스케일 기즈모",
    "show1_li_2": "0.5 단위 그리드 스냅",
    "show1_li_3": "실행 취소와 다시 실행, 복제, 깊이 레이어",
    "show1_li_4": "뷰: 정면, 3/4, 위",
    "show1_shot_alt": "에디터, 레벨 지오메트리",
    "show2_kick": "테스트",
    "show2_title": "만든 걸 그 자리에서 플레이",
    "show2_sub": "내보내기도 빌드도 없다. 클릭 한 번이면 실제 물리, 점프, 사격이 있는 내 레벨 안으로.",
    "show2_li_1": "탱크, 딜러, 스나이퍼로 테스트",
    "show2_li_2": "Cosmos Arena와 똑같은 물리와 무기",
    "show2_li_3": "즉석에서 조정. 나갔다가, 바꾸고, 다시 전투로.",
    "show2_shot_alt": "테스트, 내 레벨 플레이 중",
    "learn_kick": "가이드",
    "learn_title": "5분이면 감 잡는다",
    "learn_sub": "첫 레벨을 만들고 저장하려면 알아둘 세 가지.",
    "guide_1_tag": "어디서 시작할까",
    "guide_1_title": "지오메트리 짜기",
    "guide_1_text": "아래 팔레트에서 바닥과 플랫폼 몇 개를 놓고 스폰을 배치하자. 파이터가 지나갈 수 있는 곳과 없는 곳을 에디터가 바로 색으로 표시한다. 초록은 가능, 빨강은 불가.",
    "guide_2_tag": "저장",
    "guide_2_title": "무엇을 누를까",
    "guide_2_text_1": "레벨은 브라우저에 알아서 저장된다.",
    "guide_2_kbd_save": "저장",
    "guide_2_text_2": "은 라이브러리에 넣고,",
    "guide_2_kbd_export": "내보내기",
    "guide_2_text_3": "는 파일을 받고,",
    "guide_2_kbd_share": "공유",
    "guide_2_text_4": "는 맵 링크를 준다.",
    "guide_3_tag": "나만의 텍스처",
    "guide_3_title": "이미지 업로드",
    "guide_3_text_1": "블록을 고르고 텍스처 슬롯을 연 뒤",
    "guide_3_kbd_upload": "내 것 올리기",
    "guide_3_text_2": "를 누르자. 이미지가 면에 입혀진다. 완성 레벨이라면 파일을 프로젝트에 넣고 경로를 적어두면 영원히 남는다.",
    "rewards_kick": "보상",
    "rewards_title": "내 레벨이 게임에, 그리고 돈이 된다",
    "rewards_sub": "최고의 맵은 Cosmos Arena 공용 로테이션에 들어간다. 채택된 레벨은 제작자에게 USDT나 GRAM으로 지급. 금액은 맵의 품질과 얼마나 많이 플레이되는지에 달렸다.",
    "rstep_1_title": "만들고 제출",
    "rstep_1_text": "완성한 레벨을 에디터에서 바로 리뷰로 보낸다.",
    "rstep_2_title": "게임 입성",
    "rstep_2_text": "리뷰를 통과하면 모든 플레이어의 로테이션에 합류.",
    "rstep_3_title": "보상 받기",
    "rstep_3_text": "보상은 Telegram으로 USDT나 GRAM으로 도착한다.",
    "crit_1": "모든 롤이 지나갈 수 있음, 초록 표시",
    "crit_2": "공정한 대칭과 쾌적한 전투",
    "crit_3": "플레이가 재밌으면 맵은 로테이션에 더 오래 남는다",
    "coin_usdt_sub": "스테이블코인, 지갑으로 출금",
    "coin_gram_sub": "Telegram에서 바로",
    "faq_kick": "자주 묻는 질문",
    "faq_title": "핵심만",
    "faq_free_q": "무료인가요?",
    "faq_free_a": "네. 에디터는 브라우저에서 열기만 하면 됩니다. 설치도 결제도 없어요.",
    "faq_account_q": "계정이 필요한가요?",
    "faq_account_a": "만들기만 할 거면 필요 없어요. 계정은 레벨을 리뷰에 제출하고 보상을 받고 싶을 때만 필요합니다.",
    "faq_save_q": "레벨은 어디에 저장되나요?",
    "faq_save_a": "브라우저에 자동으로. 파일로 내려받거나 링크로 공유하면 잃어버릴 일이 없어요.",
    "faq_skill_q": "뭘 할 줄 알아야 하나요?",
    "faq_skill_a": "아무것도 필요 없어요. 마우스로 플랫폼을 놓으면 파이터가 지나갈 곳을 에디터가 알려줍니다.",
    "faq_engine_q": "제 레벨은 무엇으로 돌아가나요?",
    "faq_engine_a": "Cosmos Arena와 같은 엔진, 진짜 물리와 진짜 무기로 돌아갑니다.",
    "faq_reward_q": "보상은 어떻게 받나요?",
    "faq_reward_a": "레벨을 만들어 리뷰에 제출하세요. 게임에 채택되면 USDT나 GRAM으로 지급합니다.",
    "game_kick": "게임 소개",
    "game_sub": "살아 있는 2.5D PvP 아레나. 히어로 11명과 세 가지 롤. Studio는 그 엔진을 그대로 네 손에 쥐여준다. 만든 건 전부 진짜로 플레이된다.",
    "stat_heroes": "히어로",
    "stat_roles": "롤: 탱크, 딜러, 스나이퍼",
    "stat_engine": "게임과 에디터를 위한 엔진",
    "stat_levels": "플레이어가 만든 레벨",
    "final_kick": "준비됐어?",
    "final_title": "지금 바로 레벨을 만들자",
    "final_sub": "브라우저에서 열린다. 무료. 네가 만든 건 계속 네 것.",
    "final_undercta": "무료로 시작, 설치 없이, 브라우저에서 바로",
    "feedback_kick": "피드백",
    "feedback_title": "아이디어, 질문, 아니면 버그를 찾았나요?",
    "feedback_sub": "Telegram으로 바로 연락 주세요. 전부 읽고 답장합니다.",
    "feedback_cta": "Telegram으로 연락",
    "footer_copy": "© 2026 Space Attack",
    "footer_support": "지원"
  },
  "zh": {
    "page_title": "Space Attack Studio - 打造你自己的竞技场",
    "nav_feat": "功能",
    "nav_rewards": "奖励",
    "nav_faq": "常见问题",
    "nav_game": "游戏",
    "nav_login": "登录",
    "cta_build": "创建关卡",
    "hero_title_1": "打造你自己的",
    "hero_title_2": "竞技场",
    "hero_lead": "在浏览器里直接为 Space Attack 设计关卡。摆放平台、绘制材质、在实战中测试，再用链接分享。你做的一切都跑在和 Cosmos Arena 相同的引擎上。",
    "cta_how": "怎么玩",
    "hero_undercta": "免安装、免费、存在浏览器里",
    "hero_frame_alt": "Space Attack Studio 关卡编辑器",
    "badge_walkability": "可通行检测",
    "badge_textures": "每个面都能贴材质",
    "badge_test": "一键测试",
    "badge_parallax": "视差与纵深",
    "feat_kick": "功能",
    "feat_title": "编辑器能做什么",
    "feat_sub": "从第一块方块到可玩地图，都在一个窗口里搞定。无需写代码。",
    "feat_1_title": "摆放方块，对齐网格",
    "feat_1_text": "平台、斜坡、桥、浮岛和出生点。随意移动、调宽度，全部自动吸附。",
    "feat_2_title": "给每个面刷上材质",
    "feat_2_text": "方块每一面都能选材质，还有现成风格：空间站、矿井、水晶、残骸。",
    "feat_3_title": "任意角度查看，线框也行",
    "feat_3_text": "正视、四分之三、俯视。线框、纵深图层加视差，做出真正的立体感。",
    "feat_4_title": "在编辑器里直接开玩",
    "feat_4_text": "一键就能在自己的地图上奔跑，带真实物理、跳跃和射击。",
    "how_kick": "怎么玩",
    "how_title": "四步搞定你的竞技场",
    "step_1_title": "先搭个草稿",
    "step_1_text": "从素材栏拖出平台和出生点。网格和吸附让结构始终整齐。",
    "step_2_title": "材质",
    "step_2_text": "选个风格，把各个面刷上。再加个背景增加纵深。",
    "step_3_title": "开玩",
    "step_3_text": "点测试，就能在同一引擎的实战里检验你的关卡。",
    "step_4_title": "分享",
    "step_4_text": "保存并发出链接。别人的关卡也只需一键就能玩。",
    "show1_kick": "编辑器",
    "show1_title": "所见即所得，无需代码",
    "show1_sub": "直接在 3D 里选中、移动、缩放。工具栏在上，素材栏在下，就像真正的引擎。",
    "show1_li_1": "移动、旋转、缩放的操作手柄",
    "show1_li_2": "0.5 步进的网格吸附",
    "show1_li_3": "撤销与重做、复制、纵深图层",
    "show1_li_4": "视角：正视、四分之三、俯视",
    "show1_shot_alt": "编辑器，关卡结构",
    "show2_kick": "测试",
    "show2_title": "做完立刻就能玩",
    "show2_sub": "无需导出，也无需构建。一键就进到你的关卡里，带真实物理、跳跃和射击。",
    "show2_li_1": "用坦克、输出或狙击手来测试",
    "show2_li_2": "和 Cosmos Arena 完全相同的物理与武器",
    "show2_li_3": "随时调整：退出、改一改、再回到战斗",
    "show2_shot_alt": "测试，正在玩自己的关卡",
    "learn_kick": "教程",
    "learn_title": "五分钟就上手",
    "learn_sub": "搭建并保存你的第一个关卡，需要知道的三件事。",
    "guide_1_tag": "从哪开始",
    "guide_1_title": "搭好结构",
    "guide_1_text": "从下方素材栏拖出一块地面和几个平台，再放个出生点。编辑器会立刻标出战士能走和不能走的地方：绿色能走，红色不行。",
    "guide_2_tag": "保存",
    "guide_2_title": "该按什么",
    "guide_2_text_1": "关卡会自动保存在浏览器里。",
    "guide_2_kbd_save": "保存",
    "guide_2_text_2": "把它放进你的库，",
    "guide_2_kbd_export": "导出",
    "guide_2_text_3": "下载成文件，",
    "guide_2_kbd_share": "分享",
    "guide_2_text_4": "给你一个地图链接。",
    "guide_3_tag": "你自己的材质",
    "guide_3_title": "上传一张图",
    "guide_3_text_1": "选中一个方块，打开材质槽，点",
    "guide_3_kbd_upload": "上传我的",
    "guide_3_text_2": "。图片就会贴到那个面上。想做成正式关卡，就把文件放进项目里并填上路径，这样它会永久保留。",
    "rewards_kick": "奖励",
    "rewards_title": "你的关卡进游戏，你拿钱",
    "rewards_sub": "最棒的地图会进入 Cosmos Arena 的公共轮换。关卡被采用后，我们以 USDT 或 GRAM 付给作者。金额取决于地图质量以及被玩的频率。",
    "rstep_1_title": "做好并提交",
    "rstep_1_text": "在编辑器里就能把做好的关卡直接送去审核。",
    "rstep_2_title": "进入游戏",
    "rstep_2_text": "通过审核后，加入面向所有玩家的轮换。",
    "rstep_3_title": "领取报酬",
    "rstep_3_text": "奖励会通过 Telegram 以 USDT 或 GRAM 到账。",
    "crit_1": "所有角色都能通行，指示灯为绿色",
    "crit_2": "公平的对称与舒适的对战",
    "crit_3": "玩着有趣，地图才会在轮换里待得更久",
    "coin_usdt_sub": "稳定币，可提现到钱包",
    "coin_gram_sub": "直接在 Telegram 里",
    "faq_kick": "常见问题",
    "faq_title": "长话短说",
    "faq_free_q": "免费吗？",
    "faq_free_a": "免费。编辑器在浏览器里打开就行，不用安装，也不用付费。",
    "faq_account_q": "需要账号吗？",
    "faq_account_a": "只是搭建的话不用。只有当你想把关卡送审并拿奖励时，才需要账号。",
    "faq_save_q": "关卡保存在哪？",
    "faq_save_a": "自动存在浏览器里。你还能下载成文件或分享链接，绝不丢失。",
    "faq_skill_q": "需要会什么？",
    "faq_skill_a": "什么都不用会。用鼠标摆平台，编辑器会告诉你战士能从哪走。",
    "faq_engine_q": "我的关卡跑在什么上？",
    "faq_engine_a": "和 Cosmos Arena 相同的引擎，带真实物理和真实武器。",
    "faq_reward_q": "怎么拿奖励？",
    "faq_reward_a": "做好关卡并送审。一旦进了游戏，我们就以 USDT 或 GRAM 付款。",
    "game_kick": "关于游戏",
    "game_sub": "一个鲜活的 2.5D PvP 竞技场：11 位英雄，三种角色。Studio 就是把这台引擎交到你手上。你做的一切，都能真刀真枪地玩。",
    "stat_heroes": "英雄",
    "stat_roles": "角色：坦克、输出、狙击手",
    "stat_engine": "游戏与编辑器共用的引擎",
    "stat_levels": "玩家制作的关卡",
    "final_kick": "准备好了吗？",
    "final_title": "现在就来做你的关卡",
    "final_sub": "在浏览器里打开。免费。你的创作永远属于你。",
    "final_undercta": "免费开始，免安装，直接在浏览器里",
    "feedback_kick": "反馈",
    "feedback_title": "有想法、有疑问，或是发现了 bug？",
    "feedback_sub": "直接在 Telegram 上找我们。我们每条都看，也都会回。",
    "feedback_cta": "在 Telegram 上联系我们",
    "footer_copy": "© 2026 Space Attack",
    "footer_support": "支持"
  }
}
;
const NAMES: Record<string,string> = { ru:"Русский", en:"English", es:"Español", pt:"Português", de:"Deutsch", fr:"Français", it:"Italiano", tr:"Türkçe", id:"Bahasa", ja:"日本語", ko:"한국어", zh:"中文" };
const LOCS = Object.keys(STR);
const CSS = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Russo+One&family=Orbitron:wght@600;700;800&display=swap');
html,body,#root{background:#f3f6fb !important;color:#12203a !important;height:auto !important;min-height:100% !important;max-height:none !important;overflow-x:hidden !important;overflow-y:auto !important;position:static !important;}

  :root{
    --bg:#f3f6fb; --bg2:#ffffff; --soft:#eaf0f7; --panel:#ffffff; --border:#d7e0ec; --border2:#e6ecf4;
    --ink:#12203a; --ink2:#1c2c48; --dim:#53637d; --faint:#8a99af;
    --bl:#2f7cf6; --cy:#0fa5cf; --gr:#12b877; --amber:#e6952a; --pur:#8b5cf6;
    --ui:'Space Grotesk',-apple-system,'Segoe UI',sans-serif; --mono:'IBM Plex Mono',ui-monospace,monospace;
  }
  *{margin:0;padding:0;box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{background:var(--bg);color:var(--ink);font-family:var(--ui);line-height:1.5;-webkit-font-smoothing:antialiased;overflow-x:hidden}
  a{color:inherit;text-decoration:none}
  .wrap{max-width:1200px;margin:0 auto;padding:0 28px}
  /* faint studio grid, softly faded at TOP and BOTTOM so it never appears abruptly */
  .grid-bg{position:absolute;inset:0;z-index:0;
    background-image:linear-gradient(90deg,#c9d6e8 1px,transparent 1px),linear-gradient(0deg,#c9d6e8 1px,transparent 1px);
    background-size:54px 54px;opacity:.55;
    -webkit-mask-image:linear-gradient(180deg,transparent 0,#000 16%,#000 82%,transparent 100%);
    mask-image:linear-gradient(180deg,transparent 0,#000 16%,#000 82%,transparent 100%)}

  /* nav */
  nav{position:sticky;top:0;z-index:20;background:#f3f6fbe6;backdrop-filter:blur(10px);border-bottom:1px solid var(--border2)}
  nav .row{display:flex;align-items:center;gap:20px;height:66px}
  .logo{display:flex;align-items:center;gap:10px}
  .logo img{width:31px;height:31px;border-radius:8px;object-fit:cover;background:#0b1526;padding:2px}
  /* SPACE ATTACK = the in-game brand face (Russo One). STUDIO = a designer sci-fi face (Orbitron). */
  .logo .sa{font-family:'Russo One',sans-serif;font-size:16px;letter-spacing:.015em;color:var(--ink);line-height:1}
  .logo .st{font-family:'Orbitron',sans-serif;font-weight:700;font-size:14px;letter-spacing:.26em;text-transform:uppercase;line-height:1;margin-left:3px;background:linear-gradient(96deg,var(--bl),var(--gr));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
  nav .links{display:flex;gap:26px;margin-left:16px;color:var(--dim);font-size:15px}
  nav .links a:hover{color:var(--ink)}
  nav .spacer{flex:1}
  .btn{display:inline-flex;align-items:center;gap:8px;font-family:var(--ui);font-weight:600;font-size:15px;cursor:pointer;border-radius:10px;padding:11px 18px;border:1px solid transparent;transition:.15s}
  .btn.pri{background:linear-gradient(180deg,#4a8dff,#2f7cf6);color:#fff;box-shadow:0 10px 24px -8px #2f7cf680,inset 0 1px 0 #ffffff55}
  .btn.pri:hover{filter:brightness(1.05)}
  .btn.ghost{background:#fff;border:1px solid var(--border);color:var(--ink)}
  .btn.ghost:hover{border-color:var(--bl);color:var(--bl)}
  .btn.sm{padding:9px 14px;font-size:14px}
  .langsel{font-family:var(--ui);font-size:13px;color:var(--ink);background:#fff;border:1px solid var(--border);border-radius:9px;padding:7px 9px;cursor:pointer;outline:none}
  .langsel:hover{border-color:var(--bl)}

  /* hero */
  header{position:relative;overflow:hidden;padding:78px 0 44px}
  .glow{position:absolute;z-index:0;border-radius:50%;filter:blur(90px);opacity:.55}
  .glow.a{top:-140px;left:-90px;width:440px;height:440px;background:radial-gradient(circle,#bfe0ff,transparent 66%)}
  .glow.b{top:40px;right:-130px;width:480px;height:480px;background:radial-gradient(circle,#bef6dd,transparent 66%)}
  .hero{position:relative;z-index:2;text-align:center}
  .eyebrow{display:inline-flex;align-items:center;gap:9px;padding:7px 15px;border-radius:999px;background:#fff;border:1px solid var(--border);font-family:var(--mono);font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--bl);box-shadow:0 2px 10px -4px #2f7cf633}
  .eyebrow .d{width:7px;height:7px;border-radius:50%;background:var(--gr);box-shadow:0 0 8px #12b877aa}
  h1{font-size:70px;line-height:1.02;font-weight:700;letter-spacing:-.015em;margin:22px 0 0;color:var(--ink)}
  h1 .g{background:linear-gradient(96deg,var(--bl),var(--gr));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
  .lead{max-width:640px;margin:20px auto 0;font-size:20px;color:var(--dim)}
  .cta{display:flex;gap:14px;justify-content:center;margin-top:30px;flex-wrap:wrap}
  .undercta{margin-top:14px;color:var(--faint);font-family:var(--mono);font-size:12.5px}
  .frame{position:relative;z-index:2;margin:52px auto 0;max-width:1080px;border-radius:16px;border:1px solid var(--border);background:#fff;box-shadow:0 44px 90px -34px #21386a55,0 2px 0 #ffffff;overflow:hidden}
  .frame .bar{display:flex;align-items:center;gap:8px;padding:11px 14px;border-bottom:1px solid var(--border2);background:#f1f5fa}
  .frame .bar i{width:11px;height:11px;border-radius:50%;background:#cdd8e6;display:block}
  .frame .bar .u{margin-left:12px;font-family:var(--mono);font-size:12px;color:var(--faint)}
  .frame img{display:block;width:100%;height:auto}
  .badges{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:26px}
  .chip{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:#fff;border:1px solid var(--border);font-size:14px;color:var(--dim);box-shadow:0 2px 8px -5px #21386a33}
  .chip .k{width:9px;height:9px;border-radius:3px}

  section{position:relative;padding:88px 0}
  .kick{font-family:var(--mono);font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:var(--bl)}
  h2{font-size:40px;font-weight:700;letter-spacing:-.01em;margin:12px 0 0;color:var(--ink)}
  .sec-sub{color:var(--dim);font-size:18px;margin-top:12px;max-width:640px}
  .center{text-align:center}.center .sec-sub{margin-left:auto;margin-right:auto}

  /* screenshot gallery (replaces the icon cards) */
  .gal{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:44px}
  .tile{background:#fff;border:1px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:0 14px 36px -24px #21386a66;transition:.16s}
  .tile:hover{transform:translateY(-3px);box-shadow:0 22px 46px -24px #2f7cf655;border-color:#c6d4e8}
  .tile .im{position:relative;background:#eef3f9;border-bottom:1px solid var(--border2)}
  .tile .im img{display:block;width:100%;height:280px;object-fit:cover;object-position:center}
  .tile .cap{padding:18px 20px}
  .tile .cap b{font-size:18px;font-weight:600;display:block}
  .tile .cap p{color:var(--dim);font-size:14.5px;margin-top:5px}

  /* steps */
  .steps{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:44px}
  .step{background:#fff;border:1px solid var(--border);border-radius:14px;padding:22px;box-shadow:0 8px 24px -20px #21386a55}
  .step .n{font-family:var(--mono);font-size:22px;color:var(--gr);font-weight:600}
  .step h4{font-size:18px;margin:10px 0 6px;font-weight:600}
  .step p{color:var(--dim);font-size:14.5px}

  /* guides (tutorials) */
  .guides{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:44px}
  .guide{background:#fff;border:1px solid var(--border);border-radius:15px;padding:24px;box-shadow:0 10px 30px -22px #21386a55}
  .guide .tag{display:inline-block;font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--bl);background:#eef4fc;border:1px solid var(--border);border-radius:6px;padding:4px 9px}
  .guide h4{font-size:19px;margin:14px 0 8px;font-weight:600}
  .guide p{color:var(--dim);font-size:15px}
  .kbd{display:inline-block;font-family:var(--mono);font-size:12px;background:#12203a;color:#e6eefb;border-radius:5px;padding:2px 7px;margin:0 1px}

  /* rewards */
  .reward{display:grid;grid-template-columns:1.1fr .9fr;gap:44px;align-items:center;margin-top:20px}
  .rsteps{display:flex;flex-direction:column;gap:15px;margin-top:22px}
  .rstep{display:flex;gap:13px;align-items:flex-start}
  .rstep .rn{font-family:var(--mono);color:var(--gr);font-weight:600;font-size:15px;min-width:22px}
  .rstep b{font-weight:600;font-size:16px}.rstep p{color:var(--dim);font-size:14.5px;margin-top:2px}
  .pay{display:flex;flex-direction:column;gap:14px}
  .coin{display:flex;align-items:center;gap:13px;background:#fff;border:1px solid var(--border);border-radius:16px;padding:16px 20px;box-shadow:0 14px 34px -22px #21386a55}
  .coin img{width:40px;height:40px;object-fit:contain;border-radius:50%}
  .coin .cbadge{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-family:var(--mono);font-weight:700;font-size:19px;color:#fff;flex-shrink:0}
  .coin b{font-size:18px}.coin span{display:block;color:var(--faint);font-size:13px}
  .crit{list-style:none;display:flex;flex-direction:column;gap:9px;margin-top:20px;padding:0}
  .crit li{display:flex;gap:10px;align-items:center;color:var(--ink2);font-size:14.5px}
  .crit li::before{content:"";width:8px;height:8px;border-radius:3px;background:var(--gr);flex-shrink:0}

  /* roadmap */
  .road{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:44px}
  .road.one{grid-template-columns:1fr;max-width:720px;margin-left:auto;margin-right:auto}
  .rcol{background:#fff;border:1px solid var(--border);border-radius:16px;padding:24px 26px;box-shadow:0 12px 32px -24px #21386a55}
  .rcol h3{font-size:19px;font-weight:600;display:flex;align-items:center;gap:9px;margin-bottom:12px}
  .rli{display:flex;gap:11px;align-items:flex-start;padding:11px 0;border-top:1px solid var(--border2);font-size:15px;color:var(--ink2)}
  .rli:first-of-type{border-top:0}
  .rtag{font-family:var(--mono);font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;padding:3px 8px;border-radius:6px;flex-shrink:0;margin-top:2px}
  .rtag.done{color:#0b7a4f;background:#d8f5e8;border:1px solid #a9e6cd}
  .rtag.soon{color:#2f5fb0;background:#e4eefc;border:1px solid #c3d8f5}

  /* faq */
  .faqg{display:grid;grid-template-columns:1fr 1fr;gap:16px 30px;margin-top:40px}
  .faqi{background:#fff;border:1px solid var(--border);border-radius:14px;padding:20px 22px;box-shadow:0 10px 28px -22px #21386a55}
  .faqi b{font-size:17px;font-weight:600;display:block}
  .faqi p{color:var(--dim);font-size:15px;margin-top:6px;line-height:1.5}

  /* split showcase */
  .split{display:grid;grid-template-columns:1.05fr .95fr;gap:44px;align-items:center;margin-top:20px}
  .split.rev{direction:rtl}.split.rev>*{direction:ltr}
  .shot{border-radius:14px;border:1px solid var(--border);overflow:hidden;box-shadow:0 30px 60px -30px #21386a55;background:#fff}
  .shot img{display:block;width:100%;height:auto}
  .ul{list-style:none;margin-top:22px;display:flex;flex-direction:column;gap:13px}
  .ul li{display:flex;gap:12px;align-items:center;color:var(--ink2);font-size:16px}
  .ul li::before{content:"";width:9px;height:9px;border-radius:3px;background:var(--gr);flex-shrink:0;box-shadow:0 0 8px #12b87755}

  .band{background:var(--soft);border-top:1px solid var(--border2);border-bottom:1px solid var(--border2)}
  .stat{display:flex;gap:44px;margin-top:26px;flex-wrap:wrap}
  .stat b{font-size:36px;font-weight:700;color:var(--ink);display:block;font-family:var(--mono)}
  .stat span{color:var(--faint);font-size:14px}

  .final{position:relative;text-align:center;overflow:hidden}
  .final .panel{position:relative;z-index:2;background:linear-gradient(180deg,#ffffff,#f3f8ff);border:1px solid var(--border);border-radius:22px;padding:64px 30px;box-shadow:0 40px 90px -40px #21386a55}
  footer{border-top:1px solid var(--border2);padding:34px 0;color:var(--faint);font-size:14px;background:#fff}
  footer .row{display:flex;gap:20px;align-items:center;flex-wrap:wrap}
  footer a:hover{color:var(--ink)}

  @media(max-width:900px){
    .wrap{padding:0 20px}
    h1{font-size:46px}h2{font-size:32px}
    .gal,.steps,.guides,.road,.faqg,.reward{grid-template-columns:1fr}
    .split,.split.rev{grid-template-columns:1fr;direction:ltr}
    nav .links{display:none}
    section{padding:62px 0}
    header{padding:56px 0 32px}
    .frame{margin-top:36px}
    .stat{gap:26px;justify-content:center}
  }
  @media(max-width:560px){
    .wrap{padding:0 16px}
    h1{font-size:33px;line-height:1.06}h2{font-size:25px}
    .lead{font-size:16.5px}.sec-sub{font-size:15.5px}
    section{padding:52px 0}
    .cta{flex-direction:column;align-items:stretch;gap:10px}
    .cta .btn{justify-content:center;text-align:center;width:100%}
    nav .row{gap:10px;height:58px}
    nav .ghost{display:none}
    .logo img{width:26px;height:26px}.logo .sa{font-size:13.5px}.logo .st{font-size:11.5px;letter-spacing:.2em}
    .frame .bar .u{display:none}
    .badges{gap:7px}.chip{font-size:12.5px;padding:7px 11px}
    .tile .im img{height:200px}
    .reward{gap:22px}.pay{flex-direction:row;flex-wrap:wrap}
    .final .panel{padding:44px 18px}.final h2{font-size:30px!important}
    footer .row{flex-direction:column;align-items:flex-start;gap:9px}
  }
`;
const TMPL = `

<nav>
  <div class="wrap row">
    <div class="logo"><img src="/studio/brand.webp" alt="" /><span class="sa">SPACE ATTACK</span><span class="st">Studio</span></div>
    <div class="links">
      <a href="#sec-feat">{{nav_feat}}</a>
      <a href="#sec-rewards">{{nav_rewards}}</a>
      <a href="#sec-faq">{{nav_faq}}</a>
      <a href="#sec-game">{{nav_game}}</a>
    </div>
    <div class="spacer"></div>
    <select id="sa-lang" class="langsel" aria-label="Language"></select>
    <a class="btn ghost sm nav-login" href="https://t.me/space_attack_bot" target="_blank" rel="noopener">{{nav_login}}</a>
    <a class="btn pri sm" href="#studio">{{cta_build}}</a>
  </div>
</nav>

<header>
  <div class="grid-bg"></div>
  <div class="glow a"></div><div class="glow b"></div>
  <div class="wrap hero">
    <h1>{{hero_title_1}} <span class="g">{{hero_title_2}}</span></h1>
    <p class="lead">{{hero_lead}}</p>
    <div class="cta">
      <a class="btn pri" href="#studio">{{cta_build}}</a>
      <a class="btn ghost" href="#sec-how">{{cta_how}}</a>
    </div>
    <div class="undercta">{{hero_undercta}}</div>

    <div class="frame">
      <div class="bar"><i></i><i></i><i></i><span class="u">studio.spaceattack.app</span></div>
      <img src="/studio/studio-iso.webp" alt="{{hero_frame_alt}}" />
    </div>

    <div class="badges">
      <span class="chip"><span class="k" style="background:var(--gr)"></span>{{badge_walkability}}</span>
      <span class="chip"><span class="k" style="background:var(--bl)"></span>{{badge_textures}}</span>
      <span class="chip"><span class="k" style="background:var(--amber)"></span>{{badge_test}}</span>
      <span class="chip"><span class="k" style="background:var(--pur)"></span>{{badge_parallax}}</span>
    </div>
  </div>
</header>

<!-- FEATURES = real #studio screenshots -->
<section id="sec-feat">
  <div class="wrap center">
    <div class="kick">{{feat_kick}}</div>
    <h2>{{feat_title}}</h2>
    <p class="sec-sub">{{feat_sub}}</p>
  </div>
  <div class="wrap">
    <div class="gal">
      <div class="tile"><div class="im"><img src="/studio/studio-front.webp" alt="" /></div><div class="cap"><b>{{feat_1_title}}</b><p>{{feat_1_text}}</p></div></div>
      <div class="tile"><div class="im"><img src="/studio/studio-kit.webp" alt="" /></div><div class="cap"><b>{{feat_2_title}}</b><p>{{feat_2_text}}</p></div></div>
      <div class="tile"><div class="im"><img src="/studio/studio-iso-wire.webp" alt="" /></div><div class="cap"><b>{{feat_3_title}}</b><p>{{feat_3_text}}</p></div></div>
      <div class="tile"><div class="im"><img src="/studio/studio-play.webp" alt="" /></div><div class="cap"><b>{{feat_4_title}}</b><p>{{feat_4_text}}</p></div></div>
    </div>
  </div>
</section>

<!-- HOW IT WORKS -->
<section id="sec-how" class="band">
  <div class="wrap center">
    <div class="kick">{{how_kick}}</div>
    <h2>{{how_title}}</h2>
  </div>
  <div class="wrap">
    <div class="steps">
      <div class="step"><div class="n">01</div><h4>{{step_1_title}}</h4><p>{{step_1_text}}</p></div>
      <div class="step"><div class="n">02</div><h4>{{step_2_title}}</h4><p>{{step_2_text}}</p></div>
      <div class="step"><div class="n">03</div><h4>{{step_3_title}}</h4><p>{{step_3_text}}</p></div>
      <div class="step"><div class="n">04</div><h4>{{step_4_title}}</h4><p>{{step_4_text}}</p></div>
    </div>
  </div>
</section>

<!-- SHOWCASE 1 -->
<section>
  <div class="wrap split">
    <div>
      <div class="kick">{{show1_kick}}</div>
      <h2>{{show1_title}}</h2>
      <p class="sec-sub">{{show1_sub}}</p>
      <ul class="ul">
        <li>{{show1_li_1}}</li>
        <li>{{show1_li_2}}</li>
        <li>{{show1_li_3}}</li>
        <li>{{show1_li_4}}</li>
      </ul>
    </div>
    <div class="shot"><img src="/studio/studio-front.webp" alt="{{show1_shot_alt}}" /></div>
  </div>
</section>

<!-- SHOWCASE 2 -->
<section class="band">
  <div class="wrap split rev">
    <div>
      <div class="kick">{{show2_kick}}</div>
      <h2>{{show2_title}}</h2>
      <p class="sec-sub">{{show2_sub}}</p>
      <ul class="ul">
        <li>{{show2_li_1}}</li>
        <li>{{show2_li_2}}</li>
        <li>{{show2_li_3}}</li>
      </ul>
    </div>
    <div class="shot"><img src="/studio/studio-play.webp" alt="{{show2_shot_alt}}" /></div>
  </div>
</section>

<!-- TUTORIALS -->
<section id="sec-learn">
  <div class="wrap center">
    <div class="kick">{{learn_kick}}</div>
    <h2>{{learn_title}}</h2>
    <p class="sec-sub">{{learn_sub}}</p>
  </div>
  <div class="wrap">
    <div class="guides">
      <div class="guide"><div class="tag">{{guide_1_tag}}</div><h4>{{guide_1_title}}</h4><p>{{guide_1_text}}</p></div>
      <div class="guide"><div class="tag">{{guide_2_tag}}</div><h4>{{guide_2_title}}</h4><p>{{guide_2_text_1}} <span class="kbd">{{guide_2_kbd_save}}</span> {{guide_2_text_2}} <span class="kbd">{{guide_2_kbd_export}}</span> {{guide_2_text_3}} <span class="kbd">{{guide_2_kbd_share}}</span> {{guide_2_text_4}}</p></div>
      <div class="guide"><div class="tag">{{guide_3_tag}}</div><h4>{{guide_3_title}}</h4><p>{{guide_3_text_1}} <span class="kbd">{{guide_3_kbd_upload}}</span> {{guide_3_text_2}}</p></div>
    </div>
  </div>
</section>

<!-- REWARDS -->
<section id="sec-rewards" class="band">
  <div class="wrap reward">
    <div>
      <div class="kick">{{rewards_kick}}</div>
      <h2>{{rewards_title}}</h2>
      <p class="sec-sub">{{rewards_sub}}</p>
      <div class="rsteps">
        <div class="rstep"><span class="rn">01</span><div><b>{{rstep_1_title}}</b><p>{{rstep_1_text}}</p></div></div>
        <div class="rstep"><span class="rn">02</span><div><b>{{rstep_2_title}}</b><p>{{rstep_2_text}}</p></div></div>
        <div class="rstep"><span class="rn">03</span><div><b>{{rstep_3_title}}</b><p>{{rstep_3_text}}</p></div></div>
      </div>
      <ul class="crit">
        <li>{{crit_1}}</li>
        <li>{{crit_2}}</li>
        <li>{{crit_3}}</li>
      </ul>
    </div>
    <div>
      <div class="pay">
        <div class="coin"><svg width="40" height="40" viewBox="0 0 40 40" style="flex-shrink:0"><circle cx="20" cy="20" r="20" fill="#26a17b"/><path fill="#fff" d="M22.4 17.1v-2.3h5.3v-3.5H12.3v3.5h5.3v2.3c-4.3.2-7.6 1.1-7.6 2.1 0 1.1 3.3 1.9 7.6 2.1v7.4h4.8v-7.4c4.3-.2 7.6-1 7.6-2.1 0-1-3.3-1.9-7.6-2.1Zm0 3.5c-.1 0-.7.1-1.9.1-1 0-1.7 0-2-.1v0c-3.7-.1-6.5-.8-6.5-1.5 0-.8 2.8-1.4 6.5-1.6v2.6c.3 0 1.1.1 2 .1 1.2 0 1.8-.1 1.9-.1v-2.6c3.7.2 6.5.8 6.5 1.6 0 .7-2.8 1.4-6.5 1.5Z"/></svg><div><b>USDT</b><span>{{coin_usdt_sub}}</span></div></div>
        <div class="coin"><img src="/studio/coin_gram.webp" alt="GRAM" /><div><b>GRAM</b><span>{{coin_gram_sub}}</span></div></div>
      </div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section id="sec-faq" class="band">
  <div class="wrap center">
    <div class="kick">{{faq_kick}}</div>
    <h2>{{faq_title}}</h2>
  </div>
  <div class="wrap">
    <div class="faqg">
      <div class="faqi"><b>{{faq_free_q}}</b><p>{{faq_free_a}}</p></div>
      <div class="faqi"><b>{{faq_account_q}}</b><p>{{faq_account_a}}</p></div>
      <div class="faqi"><b>{{faq_save_q}}</b><p>{{faq_save_a}}</p></div>
      <div class="faqi"><b>{{faq_skill_q}}</b><p>{{faq_skill_a}}</p></div>
      <div class="faqi"><b>{{faq_engine_q}}</b><p>{{faq_engine_a}}</p></div>
      <div class="faqi"><b>{{faq_reward_q}}</b><p>{{faq_reward_a}}</p></div>
    </div>
  </div>
</section>

<!-- GAME -->
<section id="sec-game">
  <div class="wrap center">
    <div class="kick">{{game_kick}}</div>
    <h2>Space Attack · Cosmos Arena</h2>
    <p class="sec-sub">{{game_sub}}</p>
  </div>
  <div class="wrap center">
    <div class="stat" style="justify-content:center">
      <div><b>11</b><span>{{stat_heroes}}</span></div>
      <div><b>3</b><span>{{stat_roles}}</span></div>
      <div><b>1</b><span>{{stat_engine}}</span></div>
      <div><b>∞</b><span>{{stat_levels}}</span></div>
    </div>
  </div>
</section>

<!-- FINAL CTA -->
<section id="start" class="final">
  <div class="grid-bg"></div>
  <div class="wrap">
    <div class="panel">
      <div class="kick center">{{final_kick}}</div>
      <h2 style="font-size:46px">{{final_title}}</h2>
      <p class="sec-sub center" style="margin:14px auto 0">{{final_sub}}</p>
      <div class="cta"><a class="btn pri" href="#studio" style="font-size:17px;padding:15px 26px">{{cta_build}}</a></div>
      <div class="undercta">{{final_undercta}}</div>
    </div>
  </div>
</section>

<!-- FEEDBACK -->
<section id="sec-feedback" class="band">
  <div class="wrap center">
    <div class="kick">{{feedback_kick}}</div>
    <h2>{{feedback_title}}</h2>
    <p class="sec-sub center">{{feedback_sub}}</p>
    <div class="cta" style="justify-content:center;margin-top:26px">
      <a class="btn pri" href="https://t.me/space_attack_support" target="_blank" rel="noopener" style="font-size:16px;padding:14px 26px">{{feedback_cta}}</a>
    </div>
    <div class="undercta">@space_attack_support</div>
  </div>
</section>

<footer>
  <div class="wrap row">
    <div class="logo"><img src="/studio/brand.webp" alt="" /><span class="sa">SPACE ATTACK</span><span class="st">Studio</span></div>
    <div class="spacer"></div>
    <span>{{footer_copy}}</span>
    <a href="#sec-feat">{{nav_feat}}</a><a href="#sec-rewards">{{nav_rewards}}</a>
    <a href="https://discord.gg/PVxhJ9VFuZ" target="_blank" rel="noopener">Discord</a>
    <a href="https://t.me/space_attack_community" target="_blank" rel="noopener">Telegram</a>
    <a href="https://t.me/space_attack_support" target="_blank" rel="noopener">{{footer_support}}</a>
  </div>
</footer>

`;
function pick(): string { try { const s = localStorage.getItem("studio_lang"); if (s && STR[s]) return s; return "en"; } catch { return "en"; } }
const fill = (t: string, m: Record<string,string>) => t.replace(/\{\{(\w+)\}\}/g, (_x, k) => (m && m[k] != null ? m[k] : (STR.en[k] ?? "")));
export function StudioLanding() {
  const [loc, setLoc] = useState(pick);
  const ref = useRef<HTMLDivElement>(null);
  const html = useMemo(() => fill(TMPL, STR[loc] || STR.en), [loc]);
  useEffect(() => {
    const sel = ref.current?.querySelector<HTMLSelectElement>("#sa-lang"); if (!sel) return;
    sel.innerHTML = LOCS.map((l) => `<option value="${l}">${NAMES[l] || l}</option>`).join("");
    sel.value = loc;
    const on = () => { setLoc(sel.value); try { localStorage.setItem("studio_lang", sel.value); } catch { /* ignore */ } };
    sel.addEventListener("change", on); return () => sel.removeEventListener("change", on);
  }, [loc, html]);
  return (<><style dangerouslySetInnerHTML={{ __html: CSS }} /><div ref={ref} dangerouslySetInnerHTML={{ __html: html }} /></>);
}
