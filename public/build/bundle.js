
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value' || descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\layout\Navbar.svelte generated by Svelte v3.19.2 */

    const file = "src\\layout\\Navbar.svelte";

    function create_fragment(ctx) {
    	let nav;
    	let ul0;
    	let li0;
    	let a0;
    	let i0;
    	let t;
    	let ul1;
    	let li1;
    	let a1;
    	let i1;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			ul0 = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			i0 = element("i");
    			t = space();
    			ul1 = element("ul");
    			li1 = element("li");
    			a1 = element("a");
    			i1 = element("i");
    			attr_dev(i0, "class", "fas fa-bars");
    			add_location(i0, file, 13, 74, 293);
    			attr_dev(a0, "class", "nav-link");
    			attr_dev(a0, "data-widget", "pushmenu");
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "role", "button");
    			add_location(a0, file, 13, 8, 227);
    			attr_dev(li0, "class", "nav-item");
    			add_location(li0, file, 12, 6, 196);
    			attr_dev(ul0, "class", "navbar-nav");
    			add_location(ul0, file, 11, 4, 165);
    			attr_dev(i1, "class", "fas fa-cogs");
    			add_location(i1, file, 19, 99, 548);
    			attr_dev(a1, "class", "nav-link");
    			attr_dev(a1, "data-widget", "control-sidebar");
    			attr_dev(a1, "data-slide", "true");
    			attr_dev(a1, "href", "#");
    			attr_dev(a1, "role", "button");
    			add_location(a1, file, 19, 8, 457);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file, 18, 6, 426);
    			attr_dev(ul1, "class", "navbar-nav ml-auto");
    			add_location(ul1, file, 17, 4, 387);
    			attr_dev(nav, "class", "main-header navbar navbar-expand navbar-dark");
    			add_location(nav, file, 9, 2, 69);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, a0);
    			append_dev(a0, i0);
    			append_dev(nav, t);
    			append_dev(nav, ul1);
    			append_dev(ul1, li1);
    			append_dev(li1, a1);
    			append_dev(a1, i1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Navbar", $$slots, []);
    	return [];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut }) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => `overflow: hidden;` +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const LOCATION = {};
    const ROUTER = {};

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/history.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    function getLocation(source) {
      return {
        ...source.location,
        state: source.history.state,
        key: (source.history.state && source.history.state.key) || "initial"
      };
    }

    function createHistory(source, options) {
      const listeners = [];
      let location = getLocation(source);

      return {
        get location() {
          return location;
        },

        listen(listener) {
          listeners.push(listener);

          const popstateListener = () => {
            location = getLocation(source);
            listener({ location, action: "POP" });
          };

          source.addEventListener("popstate", popstateListener);

          return () => {
            source.removeEventListener("popstate", popstateListener);

            const index = listeners.indexOf(listener);
            listeners.splice(index, 1);
          };
        },

        navigate(to, { state, replace = false } = {}) {
          state = { ...state, key: Date.now() + "" };
          // try...catch iOS Safari limits to 100 pushState calls
          try {
            if (replace) {
              source.history.replaceState(state, null, to);
            } else {
              source.history.pushState(state, null, to);
            }
          } catch (e) {
            source.location[replace ? "replace" : "assign"](to);
          }

          location = getLocation(source);
          listeners.forEach(listener => listener({ location, action: "PUSH" }));
        }
      };
    }

    // Stores history entries in memory for testing or other platforms like Native
    function createMemorySource(initialPathname = "/") {
      let index = 0;
      const stack = [{ pathname: initialPathname, search: "" }];
      const states = [];

      return {
        get location() {
          return stack[index];
        },
        addEventListener(name, fn) {},
        removeEventListener(name, fn) {},
        history: {
          get entries() {
            return stack;
          },
          get index() {
            return index;
          },
          get state() {
            return states[index];
          },
          pushState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            index++;
            stack.push({ pathname, search });
            states.push(state);
          },
          replaceState(state, _, uri) {
            const [pathname, search = ""] = uri.split("?");
            stack[index] = { pathname, search };
            states[index] = state;
          }
        }
      };
    }

    // Global history uses window.history as the source if available,
    // otherwise a memory history
    const canUseDOM = Boolean(
      typeof window !== "undefined" &&
        window.document &&
        window.document.createElement
    );
    const globalHistory = createHistory(canUseDOM ? window : createMemorySource());
    const { navigate } = globalHistory;

    /**
     * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/utils.js
     *
     * https://github.com/reach/router/blob/master/LICENSE
     * */

    const paramRe = /^:(.+)/;

    const SEGMENT_POINTS = 4;
    const STATIC_POINTS = 3;
    const DYNAMIC_POINTS = 2;
    const SPLAT_PENALTY = 1;
    const ROOT_POINTS = 1;

    /**
     * Check if `string` starts with `search`
     * @param {string} string
     * @param {string} search
     * @return {boolean}
     */
    function startsWith(string, search) {
      return string.substr(0, search.length) === search;
    }

    /**
     * Check if `segment` is a root segment
     * @param {string} segment
     * @return {boolean}
     */
    function isRootSegment(segment) {
      return segment === "";
    }

    /**
     * Check if `segment` is a dynamic segment
     * @param {string} segment
     * @return {boolean}
     */
    function isDynamic(segment) {
      return paramRe.test(segment);
    }

    /**
     * Check if `segment` is a splat
     * @param {string} segment
     * @return {boolean}
     */
    function isSplat(segment) {
      return segment[0] === "*";
    }

    /**
     * Split up the URI into segments delimited by `/`
     * @param {string} uri
     * @return {string[]}
     */
    function segmentize(uri) {
      return (
        uri
          // Strip starting/ending `/`
          .replace(/(^\/+|\/+$)/g, "")
          .split("/")
      );
    }

    /**
     * Strip `str` of potential start and end `/`
     * @param {string} str
     * @return {string}
     */
    function stripSlashes(str) {
      return str.replace(/(^\/+|\/+$)/g, "");
    }

    /**
     * Score a route depending on how its individual segments look
     * @param {object} route
     * @param {number} index
     * @return {object}
     */
    function rankRoute(route, index) {
      const score = route.default
        ? 0
        : segmentize(route.path).reduce((score, segment) => {
            score += SEGMENT_POINTS;

            if (isRootSegment(segment)) {
              score += ROOT_POINTS;
            } else if (isDynamic(segment)) {
              score += DYNAMIC_POINTS;
            } else if (isSplat(segment)) {
              score -= SEGMENT_POINTS + SPLAT_PENALTY;
            } else {
              score += STATIC_POINTS;
            }

            return score;
          }, 0);

      return { route, score, index };
    }

    /**
     * Give a score to all routes and sort them on that
     * @param {object[]} routes
     * @return {object[]}
     */
    function rankRoutes(routes) {
      return (
        routes
          .map(rankRoute)
          // If two routes have the exact same score, we go by index instead
          .sort((a, b) =>
            a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index
          )
      );
    }

    /**
     * Ranks and picks the best route to match. Each segment gets the highest
     * amount of points, then the type of segment gets an additional amount of
     * points where
     *
     *  static > dynamic > splat > root
     *
     * This way we don't have to worry about the order of our routes, let the
     * computers do it.
     *
     * A route looks like this
     *
     *  { path, default, value }
     *
     * And a returned match looks like:
     *
     *  { route, params, uri }
     *
     * @param {object[]} routes
     * @param {string} uri
     * @return {?object}
     */
    function pick(routes, uri) {
      let match;
      let default_;

      const [uriPathname] = uri.split("?");
      const uriSegments = segmentize(uriPathname);
      const isRootUri = uriSegments[0] === "";
      const ranked = rankRoutes(routes);

      for (let i = 0, l = ranked.length; i < l; i++) {
        const route = ranked[i].route;
        let missed = false;

        if (route.default) {
          default_ = {
            route,
            params: {},
            uri
          };
          continue;
        }

        const routeSegments = segmentize(route.path);
        const params = {};
        const max = Math.max(uriSegments.length, routeSegments.length);
        let index = 0;

        for (; index < max; index++) {
          const routeSegment = routeSegments[index];
          const uriSegment = uriSegments[index];

          if (routeSegment !== undefined && isSplat(routeSegment)) {
            // Hit a splat, just grab the rest, and return a match
            // uri:   /files/documents/work
            // route: /files/* or /files/*splatname
            const splatName = routeSegment === "*" ? "*" : routeSegment.slice(1);

            params[splatName] = uriSegments
              .slice(index)
              .map(decodeURIComponent)
              .join("/");
            break;
          }

          if (uriSegment === undefined) {
            // URI is shorter than the route, no match
            // uri:   /users
            // route: /users/:userId
            missed = true;
            break;
          }

          let dynamicMatch = paramRe.exec(routeSegment);

          if (dynamicMatch && !isRootUri) {
            const value = decodeURIComponent(uriSegment);
            params[dynamicMatch[1]] = value;
          } else if (routeSegment !== uriSegment) {
            // Current segments don't match, not dynamic, not splat, so no match
            // uri:   /users/123/settings
            // route: /users/:id/profile
            missed = true;
            break;
          }
        }

        if (!missed) {
          match = {
            route,
            params,
            uri: "/" + uriSegments.slice(0, index).join("/")
          };
          break;
        }
      }

      return match || default_ || null;
    }

    /**
     * Check if the `path` matches the `uri`.
     * @param {string} path
     * @param {string} uri
     * @return {?object}
     */
    function match(route, uri) {
      return pick([route], uri);
    }

    /**
     * Add the query to the pathname if a query is given
     * @param {string} pathname
     * @param {string} [query]
     * @return {string}
     */
    function addQuery(pathname, query) {
      return pathname + (query ? `?${query}` : "");
    }

    /**
     * Resolve URIs as though every path is a directory, no files. Relative URIs
     * in the browser can feel awkward because not only can you be "in a directory",
     * you can be "at a file", too. For example:
     *
     *  browserSpecResolve('foo', '/bar/') => /bar/foo
     *  browserSpecResolve('foo', '/bar') => /foo
     *
     * But on the command line of a file system, it's not as complicated. You can't
     * `cd` from a file, only directories. This way, links have to know less about
     * their current path. To go deeper you can do this:
     *
     *  <Link to="deeper"/>
     *  // instead of
     *  <Link to=`{${props.uri}/deeper}`/>
     *
     * Just like `cd`, if you want to go deeper from the command line, you do this:
     *
     *  cd deeper
     *  # not
     *  cd $(pwd)/deeper
     *
     * By treating every path as a directory, linking to relative paths should
     * require less contextual information and (fingers crossed) be more intuitive.
     * @param {string} to
     * @param {string} base
     * @return {string}
     */
    function resolve(to, base) {
      // /foo/bar, /baz/qux => /foo/bar
      if (startsWith(to, "/")) {
        return to;
      }

      const [toPathname, toQuery] = to.split("?");
      const [basePathname] = base.split("?");
      const toSegments = segmentize(toPathname);
      const baseSegments = segmentize(basePathname);

      // ?a=b, /users?b=c => /users?a=b
      if (toSegments[0] === "") {
        return addQuery(basePathname, toQuery);
      }

      // profile, /users/789 => /users/789/profile
      if (!startsWith(toSegments[0], ".")) {
        const pathname = baseSegments.concat(toSegments).join("/");

        return addQuery((basePathname === "/" ? "" : "/") + pathname, toQuery);
      }

      // ./       , /users/123 => /users/123
      // ../      , /users/123 => /users
      // ../..    , /users/123 => /
      // ../../one, /a/b/c/d   => /a/b/one
      // .././one , /a/b/c/d   => /a/b/c/one
      const allSegments = baseSegments.concat(toSegments);
      const segments = [];

      allSegments.forEach(segment => {
        if (segment === "..") {
          segments.pop();
        } else if (segment !== ".") {
          segments.push(segment);
        }
      });

      return addQuery("/" + segments.join("/"), toQuery);
    }

    /**
     * Combines the `basepath` and the `path` into one path.
     * @param {string} basepath
     * @param {string} path
     */
    function combinePaths(basepath, path) {
      return `${stripSlashes(
    path === "/" ? basepath : `${stripSlashes(basepath)}/${stripSlashes(path)}`
  )}/`;
    }

    /**
     * Decides whether a given `event` should result in a navigation or not.
     * @param {object} event
     */
    function shouldNavigate(event) {
      return (
        !event.defaultPrevented &&
        event.button === 0 &&
        !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
      );
    }

    /* node_modules\svelte-routing\src\Router.svelte generated by Svelte v3.19.2 */

    function create_fragment$1(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[16].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 32768) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[15], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[15], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $base;
    	let $location;
    	let $routes;
    	let { basepath = "/" } = $$props;
    	let { url = null } = $$props;
    	const locationContext = getContext(LOCATION);
    	const routerContext = getContext(ROUTER);
    	const routes = writable([]);
    	validate_store(routes, "routes");
    	component_subscribe($$self, routes, value => $$invalidate(8, $routes = value));
    	const activeRoute = writable(null);
    	let hasActiveRoute = false; // Used in SSR to synchronously set that a Route is active.

    	// If locationContext is not set, this is the topmost Router in the tree.
    	// If the `url` prop is given we force the location to it.
    	const location = locationContext || writable(url ? { pathname: url } : globalHistory.location);

    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(7, $location = value));

    	// If routerContext is set, the routerBase of the parent Router
    	// will be the base for this Router's descendants.
    	// If routerContext is not set, the path and resolved uri will both
    	// have the value of the basepath prop.
    	const base = routerContext
    	? routerContext.routerBase
    	: writable({ path: basepath, uri: basepath });

    	validate_store(base, "base");
    	component_subscribe($$self, base, value => $$invalidate(6, $base = value));

    	const routerBase = derived([base, activeRoute], ([base, activeRoute]) => {
    		// If there is no activeRoute, the routerBase will be identical to the base.
    		if (activeRoute === null) {
    			return base;
    		}

    		const { path: basepath } = base;
    		const { route, uri } = activeRoute;

    		// Remove the potential /* or /*splatname from
    		// the end of the child Routes relative paths.
    		const path = route.default
    		? basepath
    		: route.path.replace(/\*.*$/, "");

    		return { path, uri };
    	});

    	function registerRoute(route) {
    		const { path: basepath } = $base;
    		let { path } = route;

    		// We store the original path in the _path property so we can reuse
    		// it when the basepath changes. The only thing that matters is that
    		// the route reference is intact, so mutation is fine.
    		route._path = path;

    		route.path = combinePaths(basepath, path);

    		if (typeof window === "undefined") {
    			// In SSR we should set the activeRoute immediately if it is a match.
    			// If there are more Routes being registered after a match is found,
    			// we just skip them.
    			if (hasActiveRoute) {
    				return;
    			}

    			const matchingRoute = match(route, $location.pathname);

    			if (matchingRoute) {
    				activeRoute.set(matchingRoute);
    				hasActiveRoute = true;
    			}
    		} else {
    			routes.update(rs => {
    				rs.push(route);
    				return rs;
    			});
    		}
    	}

    	function unregisterRoute(route) {
    		routes.update(rs => {
    			const index = rs.indexOf(route);
    			rs.splice(index, 1);
    			return rs;
    		});
    	}

    	if (!locationContext) {
    		// The topmost Router in the tree is responsible for updating
    		// the location store and supplying it through context.
    		onMount(() => {
    			const unlisten = globalHistory.listen(history => {
    				location.set(history.location);
    			});

    			return unlisten;
    		});

    		setContext(LOCATION, location);
    	}

    	setContext(ROUTER, {
    		activeRoute,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute
    	});

    	const writable_props = ["basepath", "url"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Router", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ("url" in $$props) $$invalidate(4, url = $$props.url);
    		if ("$$scope" in $$props) $$invalidate(15, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		setContext,
    		onMount,
    		writable,
    		derived,
    		LOCATION,
    		ROUTER,
    		globalHistory,
    		pick,
    		match,
    		stripSlashes,
    		combinePaths,
    		basepath,
    		url,
    		locationContext,
    		routerContext,
    		routes,
    		activeRoute,
    		hasActiveRoute,
    		location,
    		base,
    		routerBase,
    		registerRoute,
    		unregisterRoute,
    		$base,
    		$location,
    		$routes
    	});

    	$$self.$inject_state = $$props => {
    		if ("basepath" in $$props) $$invalidate(3, basepath = $$props.basepath);
    		if ("url" in $$props) $$invalidate(4, url = $$props.url);
    		if ("hasActiveRoute" in $$props) hasActiveRoute = $$props.hasActiveRoute;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$base*/ 64) {
    			// This reactive statement will update all the Routes' path when
    			// the basepath changes.
    			 {
    				const { path: basepath } = $base;

    				routes.update(rs => {
    					rs.forEach(r => r.path = combinePaths(basepath, r._path));
    					return rs;
    				});
    			}
    		}

    		if ($$self.$$.dirty & /*$routes, $location*/ 384) {
    			// This reactive statement will be run when the Router is created
    			// when there are no Routes and then again the following tick, so it
    			// will not find an active Route in SSR and in the browser it will only
    			// pick an active Route after all Routes have been registered.
    			 {
    				const bestMatch = pick($routes, $location.pathname);
    				activeRoute.set(bestMatch);
    			}
    		}
    	};

    	return [
    		routes,
    		location,
    		base,
    		basepath,
    		url,
    		hasActiveRoute,
    		$base,
    		$location,
    		$routes,
    		locationContext,
    		routerContext,
    		activeRoute,
    		routerBase,
    		registerRoute,
    		unregisterRoute,
    		$$scope,
    		$$slots
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { basepath: 3, url: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get basepath() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set basepath(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-routing\src\Route.svelte generated by Svelte v3.19.2 */

    const get_default_slot_changes = dirty => ({
    	params: dirty & /*routeParams*/ 2,
    	location: dirty & /*$location*/ 16
    });

    const get_default_slot_context = ctx => ({
    	params: /*routeParams*/ ctx[1],
    	location: /*$location*/ ctx[4]
    });

    // (40:0) {#if $activeRoute !== null && $activeRoute.route === route}
    function create_if_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*component*/ ctx[0] !== null) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(40:0) {#if $activeRoute !== null && $activeRoute.route === route}",
    		ctx
    	});

    	return block;
    }

    // (43:2) {:else}
    function create_else_block(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[13].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], get_default_slot_context);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot && default_slot.p && dirty & /*$$scope, routeParams, $location*/ 4114) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[12], get_default_slot_context), get_slot_changes(default_slot_template, /*$$scope*/ ctx[12], dirty, get_default_slot_changes));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(43:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (41:2) {#if component !== null}
    function create_if_block_1(ctx) {
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{ location: /*$location*/ ctx[4] },
    		/*routeParams*/ ctx[1],
    		/*routeProps*/ ctx[2]
    	];

    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*$location, routeParams, routeProps*/ 22)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*$location*/ 16 && { location: /*$location*/ ctx[4] },
    					dirty & /*routeParams*/ 2 && get_spread_object(/*routeParams*/ ctx[1]),
    					dirty & /*routeProps*/ 4 && get_spread_object(/*routeProps*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(41:2) {#if component !== null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$activeRoute*/ ctx[3] !== null && /*$activeRoute*/ ctx[3].route === /*route*/ ctx[7] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$activeRoute*/ ctx[3] !== null && /*$activeRoute*/ ctx[3].route === /*route*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $activeRoute;
    	let $location;
    	let { path = "" } = $$props;
    	let { component = null } = $$props;
    	const { registerRoute, unregisterRoute, activeRoute } = getContext(ROUTER);
    	validate_store(activeRoute, "activeRoute");
    	component_subscribe($$self, activeRoute, value => $$invalidate(3, $activeRoute = value));
    	const location = getContext(LOCATION);
    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(4, $location = value));

    	const route = {
    		path,
    		// If no path prop is given, this Route will act as the default Route
    		// that is rendered if no other Route in the Router is a match.
    		default: path === ""
    	};

    	let routeParams = {};
    	let routeProps = {};
    	registerRoute(route);

    	// There is no need to unregister Routes in SSR since it will all be
    	// thrown away anyway.
    	if (typeof window !== "undefined") {
    		onDestroy(() => {
    			unregisterRoute(route);
    		});
    	}

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Route", $$slots, ['default']);

    	$$self.$set = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("path" in $$new_props) $$invalidate(8, path = $$new_props.path);
    		if ("component" in $$new_props) $$invalidate(0, component = $$new_props.component);
    		if ("$$scope" in $$new_props) $$invalidate(12, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		onDestroy,
    		ROUTER,
    		LOCATION,
    		path,
    		component,
    		registerRoute,
    		unregisterRoute,
    		activeRoute,
    		location,
    		route,
    		routeParams,
    		routeProps,
    		$activeRoute,
    		$location
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), $$new_props));
    		if ("path" in $$props) $$invalidate(8, path = $$new_props.path);
    		if ("component" in $$props) $$invalidate(0, component = $$new_props.component);
    		if ("routeParams" in $$props) $$invalidate(1, routeParams = $$new_props.routeParams);
    		if ("routeProps" in $$props) $$invalidate(2, routeProps = $$new_props.routeProps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$activeRoute*/ 8) {
    			 if ($activeRoute && $activeRoute.route === route) {
    				$$invalidate(1, routeParams = $activeRoute.params);
    			}
    		}

    		 {
    			const { path, component, ...rest } = $$props;
    			$$invalidate(2, routeProps = rest);
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		component,
    		routeParams,
    		routeProps,
    		$activeRoute,
    		$location,
    		activeRoute,
    		location,
    		route,
    		path,
    		registerRoute,
    		unregisterRoute,
    		$$props,
    		$$scope,
    		$$slots
    	];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { path: 8, component: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get path() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-routing\src\Link.svelte generated by Svelte v3.19.2 */
    const file$1 = "node_modules\\svelte-routing\\src\\Link.svelte";

    function create_fragment$3(ctx) {
    	let a;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[16].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);

    	let a_levels = [
    		{ href: /*href*/ ctx[0] },
    		{ "aria-current": /*ariaCurrent*/ ctx[2] },
    		/*props*/ ctx[1]
    	];

    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			set_attributes(a, a_data);
    			add_location(a, file$1, 40, 0, 1249);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;
    			dispose = listen_dev(a, "click", /*onClick*/ ctx[5], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 32768) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[15], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[15], dirty, null));
    			}

    			set_attributes(a, get_spread_update(a_levels, [
    				dirty & /*href*/ 1 && { href: /*href*/ ctx[0] },
    				dirty & /*ariaCurrent*/ 4 && { "aria-current": /*ariaCurrent*/ ctx[2] },
    				dirty & /*props*/ 2 && /*props*/ ctx[1]
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $base;
    	let $location;
    	let { to = "#" } = $$props;
    	let { replace = false } = $$props;
    	let { state = {} } = $$props;
    	let { getProps = () => ({}) } = $$props;
    	const { base } = getContext(ROUTER);
    	validate_store(base, "base");
    	component_subscribe($$self, base, value => $$invalidate(12, $base = value));
    	const location = getContext(LOCATION);
    	validate_store(location, "location");
    	component_subscribe($$self, location, value => $$invalidate(13, $location = value));
    	const dispatch = createEventDispatcher();
    	let href, isPartiallyCurrent, isCurrent, props;

    	function onClick(event) {
    		dispatch("click", event);

    		if (shouldNavigate(event)) {
    			event.preventDefault();

    			// Don't push another entry to the history stack when the user
    			// clicks on a Link to the page they are currently on.
    			const shouldReplace = $location.pathname === href || replace;

    			navigate(href, { state, replace: shouldReplace });
    		}
    	}

    	const writable_props = ["to", "replace", "state", "getProps"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Link> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Link", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("to" in $$props) $$invalidate(6, to = $$props.to);
    		if ("replace" in $$props) $$invalidate(7, replace = $$props.replace);
    		if ("state" in $$props) $$invalidate(8, state = $$props.state);
    		if ("getProps" in $$props) $$invalidate(9, getProps = $$props.getProps);
    		if ("$$scope" in $$props) $$invalidate(15, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		createEventDispatcher,
    		ROUTER,
    		LOCATION,
    		navigate,
    		startsWith,
    		resolve,
    		shouldNavigate,
    		to,
    		replace,
    		state,
    		getProps,
    		base,
    		location,
    		dispatch,
    		href,
    		isPartiallyCurrent,
    		isCurrent,
    		props,
    		onClick,
    		$base,
    		$location,
    		ariaCurrent
    	});

    	$$self.$inject_state = $$props => {
    		if ("to" in $$props) $$invalidate(6, to = $$props.to);
    		if ("replace" in $$props) $$invalidate(7, replace = $$props.replace);
    		if ("state" in $$props) $$invalidate(8, state = $$props.state);
    		if ("getProps" in $$props) $$invalidate(9, getProps = $$props.getProps);
    		if ("href" in $$props) $$invalidate(0, href = $$props.href);
    		if ("isPartiallyCurrent" in $$props) $$invalidate(10, isPartiallyCurrent = $$props.isPartiallyCurrent);
    		if ("isCurrent" in $$props) $$invalidate(11, isCurrent = $$props.isCurrent);
    		if ("props" in $$props) $$invalidate(1, props = $$props.props);
    		if ("ariaCurrent" in $$props) $$invalidate(2, ariaCurrent = $$props.ariaCurrent);
    	};

    	let ariaCurrent;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*to, $base*/ 4160) {
    			 $$invalidate(0, href = to === "/" ? $base.uri : resolve(to, $base.uri));
    		}

    		if ($$self.$$.dirty & /*$location, href*/ 8193) {
    			 $$invalidate(10, isPartiallyCurrent = startsWith($location.pathname, href));
    		}

    		if ($$self.$$.dirty & /*href, $location*/ 8193) {
    			 $$invalidate(11, isCurrent = href === $location.pathname);
    		}

    		if ($$self.$$.dirty & /*isCurrent*/ 2048) {
    			 $$invalidate(2, ariaCurrent = isCurrent ? "page" : undefined);
    		}

    		if ($$self.$$.dirty & /*getProps, $location, href, isPartiallyCurrent, isCurrent*/ 11777) {
    			 $$invalidate(1, props = getProps({
    				location: $location,
    				href,
    				isPartiallyCurrent,
    				isCurrent
    			}));
    		}
    	};

    	return [
    		href,
    		props,
    		ariaCurrent,
    		base,
    		location,
    		onClick,
    		to,
    		replace,
    		state,
    		getProps,
    		isPartiallyCurrent,
    		isCurrent,
    		$base,
    		$location,
    		dispatch,
    		$$scope,
    		$$slots
    	];
    }

    class Link extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { to: 6, replace: 7, state: 8, getProps: 9 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Link",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get to() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set to(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get replace() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set replace(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get state() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getProps() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set getProps(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\layout\Sidebar.svelte generated by Svelte v3.19.2 */
    const file$2 = "src\\layout\\Sidebar.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (232:10) {#if nav_item.nav_child.length > 0}
    function create_if_block_2(ctx) {
    	let div1;
    	let div0;
    	let i;
    	let i_class_value;
    	let t0;
    	let p;
    	let t1_value = /*nav_item*/ ctx[11].nav_body + "";
    	let t1;
    	let t2;
    	let t3;
    	let if_block1_anchor;
    	let current;
    	let dispose;
    	let if_block0 = /*nav_item*/ ctx[11].nav_child.length > 0 && create_if_block_4(ctx);

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[9](/*nav_item*/ ctx[11], ...args);
    	}

    	let if_block1 = /*nav_item*/ ctx[11].nav_show_child == true && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			i = element("i");
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(i, "class", i_class_value = "nav-icon " + /*nav_item*/ ctx[11].nav_icon + " mt-1 col-1 mr-0" + " svelte-j1xut8");
    			add_location(i, file$2, 234, 16, 6487);
    			attr_dev(p, "class", "mt-0 col-10");
    			add_location(p, file$2, 235, 16, 6565);
    			attr_dev(div0, "class", "row text-white position-relative");
    			add_location(div0, file$2, 233, 14, 6423);
    			attr_dev(div1, "class", "nav-argon-item mt-2 svelte-j1xut8");
    			add_location(div1, file$2, 232, 12, 6332);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, i);
    			append_dev(div0, t0);
    			append_dev(div0, p);
    			append_dev(p, t1);
    			append_dev(div0, t2);
    			if (if_block0) if_block0.m(div0, null);
    			insert_dev(target, t3, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    			dispose = listen_dev(div1, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty & /*navbar_item*/ 1 && i_class_value !== (i_class_value = "nav-icon " + /*nav_item*/ ctx[11].nav_icon + " mt-1 col-1 mr-0" + " svelte-j1xut8")) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if ((!current || dirty & /*navbar_item*/ 1) && t1_value !== (t1_value = /*nav_item*/ ctx[11].nav_body + "")) set_data_dev(t1, t1_value);

    			if (/*nav_item*/ ctx[11].nav_child.length > 0) {
    				if (!if_block0) {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*nav_item*/ ctx[11].nav_show_child == true) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t3);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(232:10) {#if nav_item.nav_child.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (237:16) {#if nav_item.nav_child.length > 0}
    function create_if_block_4(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fa fa-chevron-left");
    			set_style(i, "position", "absolute");
    			set_style(i, "right", "10px");
    			set_style(i, "top", "7px");
    			set_style(i, "font-size", "13px");
    			add_location(i, file$2, 237, 18, 6684);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(237:16) {#if nav_item.nav_child.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (242:12) {#if nav_item.nav_show_child == true}
    function create_if_block_3(ctx) {
    	let div;
    	let div_transition;
    	let current;
    	let each_value_1 = /*nav_item*/ ctx[11].nav_child;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(div, file$2, 242, 14, 6915);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*navbar_item, toggleNav*/ 17) {
    				each_value_1 = /*nav_item*/ ctx[11].nav_child;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, { y: 100, duration: 300 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, { y: 100, duration: 300 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(242:12) {#if nav_item.nav_show_child == true}",
    		ctx
    	});

    	return block;
    }

    // (245:18) <Link to="{nav_child.nav_to}">
    function create_default_slot_1(ctx) {
    	let div;
    	let i;
    	let i_class_value;
    	let t0;
    	let p;
    	let t1_value = /*nav_child*/ ctx[14].nav_body + "";
    	let t1;
    	let t2;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[10](/*nav_item*/ ctx[11], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			i = element("i");
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(i, "class", i_class_value = "nav-icon " + /*nav_child*/ ctx[14].nav_icon + " mt-1 col-1 mr-0" + " svelte-j1xut8");
    			add_location(i, file$2, 246, 22, 7228);
    			attr_dev(p, "class", "mt-0 col-10");
    			add_location(p, file$2, 247, 22, 7313);
    			attr_dev(div, "class", "nav-argon-item row text-white position-relative ml-1 svelte-j1xut8");
    			add_location(div, file$2, 245, 20, 7096);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, i);
    			append_dev(div, t0);
    			append_dev(div, p);
    			append_dev(p, t1);
    			insert_dev(target, t2, anchor);
    			dispose = listen_dev(div, "click", click_handler_1, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*navbar_item*/ 1 && i_class_value !== (i_class_value = "nav-icon " + /*nav_child*/ ctx[14].nav_icon + " mt-1 col-1 mr-0" + " svelte-j1xut8")) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (dirty & /*navbar_item*/ 1 && t1_value !== (t1_value = /*nav_child*/ ctx[14].nav_body + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t2);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(245:18) <Link to=\\\"{nav_child.nav_to}\\\">",
    		ctx
    	});

    	return block;
    }

    // (244:16) {#each nav_item.nav_child as nav_child}
    function create_each_block_1(ctx) {
    	let current;

    	const link = new Link({
    			props: {
    				to: /*nav_child*/ ctx[14].nav_to,
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(link.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(link, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const link_changes = {};
    			if (dirty & /*navbar_item*/ 1) link_changes.to = /*nav_child*/ ctx[14].nav_to;

    			if (dirty & /*$$scope, navbar_item*/ 131073) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(link, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(244:16) {#each nav_item.nav_child as nav_child}",
    		ctx
    	});

    	return block;
    }

    // (256:10) {#if nav_item.nav_child.length == 0}
    function create_if_block$1(ctx) {
    	let current;

    	const link = new Link({
    			props: {
    				to: /*nav_item*/ ctx[11].nav_to,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(link.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(link, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const link_changes = {};
    			if (dirty & /*navbar_item*/ 1) link_changes.to = /*nav_item*/ ctx[11].nav_to;

    			if (dirty & /*$$scope, navbar_item*/ 131073) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(link, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(256:10) {#if nav_item.nav_child.length == 0}",
    		ctx
    	});

    	return block;
    }

    // (262:18) {#if nav_item.nav_child.length > 0}
    function create_if_block_1$1(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fa fa-chevron-left");
    			set_style(i, "position", "absolute");
    			set_style(i, "right", "10px");
    			set_style(i, "top", "7px");
    			set_style(i, "font-size", "13px");
    			add_location(i, file$2, 262, 20, 7941);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(262:18) {#if nav_item.nav_child.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (257:12) <Link to="{nav_item.nav_to}">
    function create_default_slot(ctx) {
    	let div1;
    	let div0;
    	let i;
    	let i_class_value;
    	let t0;
    	let p;
    	let t1_value = /*nav_item*/ ctx[11].nav_body + "";
    	let t1;
    	let t2;
    	let t3;
    	let if_block = /*nav_item*/ ctx[11].nav_child.length > 0 && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			i = element("i");
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			attr_dev(i, "class", i_class_value = "nav-icon " + /*nav_item*/ ctx[11].nav_icon + " mt-1 col-1 mr-0" + " svelte-j1xut8");
    			add_location(i, file$2, 259, 18, 7738);
    			attr_dev(p, "class", "mt-0 col-10");
    			add_location(p, file$2, 260, 18, 7818);
    			attr_dev(div0, "class", "row text-white position-relative");
    			add_location(div0, file$2, 258, 16, 7672);
    			attr_dev(div1, "class", "nav-argon-item mt-2 svelte-j1xut8");
    			add_location(div1, file$2, 257, 14, 7621);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, i);
    			append_dev(div0, t0);
    			append_dev(div0, p);
    			append_dev(p, t1);
    			append_dev(div0, t2);
    			if (if_block) if_block.m(div0, null);
    			insert_dev(target, t3, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*navbar_item*/ 1 && i_class_value !== (i_class_value = "nav-icon " + /*nav_item*/ ctx[11].nav_icon + " mt-1 col-1 mr-0" + " svelte-j1xut8")) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (dirty & /*navbar_item*/ 1 && t1_value !== (t1_value = /*nav_item*/ ctx[11].nav_body + "")) set_data_dev(t1, t1_value);

    			if (/*nav_item*/ ctx[11].nav_child.length > 0) {
    				if (!if_block) {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(257:12) <Link to=\\\"{nav_item.nav_to}\\\">",
    		ctx
    	});

    	return block;
    }

    // (230:8) {#each navbar_item as nav_item}
    function create_each_block(ctx) {
    	let t;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = /*nav_item*/ ctx[11].nav_child.length > 0 && create_if_block_2(ctx);
    	let if_block1 = /*nav_item*/ ctx[11].nav_child.length == 0 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*nav_item*/ ctx[11].nav_child.length > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*nav_item*/ ctx[11].nav_child.length == 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(230:8) {#each navbar_item as nav_item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let aside;
    	let div6;
    	let a0;
    	let div2;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let div1;
    	let p0;
    	let t2;
    	let p1;
    	let t4;
    	let div5;
    	let div4;
    	let a1;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let div3;
    	let p2;
    	let t7;
    	let p3;
    	let t9;
    	let hr;
    	let t10;
    	let nav0;
    	let t11;
    	let nav1;
    	let ul0;
    	let li0;
    	let a2;
    	let i0;
    	let t12;
    	let ul1;
    	let li1;
    	let a3;
    	let i1;
    	let current;
    	let dispose;
    	let each_value = /*navbar_item*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			aside = element("aside");
    			div6 = element("div");
    			a0 = element("a");
    			div2 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t0 = space();
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = "LumeraSys";
    			t2 = space();
    			p1 = element("p");
    			p1.textContent = "Versi 1.0 rilis 2020";
    			t4 = space();
    			div5 = element("div");
    			div4 = element("div");
    			a1 = element("a");
    			img1 = element("img");
    			t5 = space();
    			div3 = element("div");
    			p2 = element("p");
    			p2.textContent = "Ko Mi Ran";
    			t7 = space();
    			p3 = element("p");
    			p3.textContent = "Administrator";
    			t9 = space();
    			hr = element("hr");
    			t10 = space();
    			nav0 = element("nav");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t11 = space();
    			nav1 = element("nav");
    			ul0 = element("ul");
    			li0 = element("li");
    			a2 = element("a");
    			i0 = element("i");
    			t12 = space();
    			ul1 = element("ul");
    			li1 = element("li");
    			a3 = element("a");
    			i1 = element("i");
    			if (img0.src !== (img0_src_value = "./assets/img/logo.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Lumera Logo");
    			set_style(img0, "width", "80px");
    			set_style(img0, "height", "80px");
    			add_location(img0, file$2, 202, 10, 5152);
    			attr_dev(div0, "class", "col-4");
    			add_location(div0, file$2, 201, 8, 5121);
    			attr_dev(p0, "class", "brand-text-1 mb-1 font-weight-light svelte-j1xut8");
    			add_location(p0, file$2, 205, 10, 5304);
    			attr_dev(p1, "class", "brand-text-2 mt-0 font-weight-bold svelte-j1xut8");
    			add_location(p1, file$2, 206, 10, 5376);
    			attr_dev(div1, "class", "col-6 mt-3 ml-2");
    			add_location(div1, file$2, 204, 8, 5263);
    			attr_dev(div2, "class", "row w-100");
    			add_location(div2, file$2, 200, 6, 5088);
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "class", "brand-link");
    			add_location(a0, file$2, 199, 4, 5049);
    			attr_dev(img1, "alt", "Image placeholder");
    			if (img1.src !== (img1_src_value = "./assets/img/profile_picture/avatar_1.jpg")) attr_dev(img1, "src", img1_src_value);
    			add_location(img1, file$2, 217, 14, 5779);
    			attr_dev(a1, "href", "javascript:;");
    			attr_dev(a1, "class", "avatar rounded-circle");
    			add_location(a1, file$2, 216, 10, 5710);
    			attr_dev(p2, "class", "user-authorization-name m-0 mb-1 svelte-j1xut8");
    			add_location(p2, file$2, 220, 12, 5935);
    			attr_dev(p3, "class", "user-authorization-status svelte-j1xut8");
    			add_location(p3, file$2, 221, 12, 6006);
    			attr_dev(div3, "class", "user-authorization-info svelte-j1xut8");
    			add_location(div3, file$2, 219, 10, 5884);
    			attr_dev(div4, "class", "user-panel mt-1 ml-0 d-flex elevation-2 pt-3 pl-3 pb-1 svelte-j1xut8");
    			add_location(div4, file$2, 214, 6, 5591);
    			attr_dev(hr, "class", "mt-3 mb-4");
    			add_location(hr, file$2, 225, 6, 6102);
    			attr_dev(nav0, "class", "mt-3 container");
    			add_location(nav0, file$2, 228, 6, 6165);
    			attr_dev(div5, "class", "sidebar");
    			add_location(div5, file$2, 212, 4, 5516);
    			attr_dev(div6, "class", "text-white");
    			set_style(div6, "margin", "7px");
    			add_location(div6, file$2, 196, 2, 4967);
    			attr_dev(aside, "class", "main-sidebar bg-primary elevation-4 sidebar-anim svelte-j1xut8");
    			set_style(aside, "position", "fixed");
    			set_style(aside, "height", "100vh");
    			set_style(aside, "transform", "translateX(" + /*sidebar_visible*/ ctx[1] + "px)");
    			set_style(aside, "overflow-y", "auto");
    			add_location(aside, file$2, 194, 0, 4796);
    			attr_dev(i0, "class", "fas fa-bars");
    			add_location(i0, file$2, 279, 80, 8606);
    			attr_dev(a2, "class", "nav-link text-primary");
    			attr_dev(a2, "role", "button");
    			add_location(a2, file$2, 279, 8, 8534);
    			attr_dev(li0, "class", "nav-item");
    			set_style(li0, "cursor", "pointer");
    			add_location(li0, file$2, 278, 6, 8478);
    			attr_dev(ul0, "class", "navbar-nav");
    			add_location(ul0, file$2, 277, 4, 8447);
    			attr_dev(i1, "class", "fas fa-cogs");
    			add_location(i1, file$2, 285, 99, 8861);
    			attr_dev(a3, "class", "nav-link");
    			attr_dev(a3, "data-widget", "control-sidebar");
    			attr_dev(a3, "data-slide", "true");
    			attr_dev(a3, "href", "#");
    			attr_dev(a3, "role", "button");
    			add_location(a3, file$2, 285, 8, 8770);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file$2, 284, 6, 8739);
    			attr_dev(ul1, "class", "navbar-nav ml-auto");
    			add_location(ul1, file$2, 283, 4, 8700);
    			attr_dev(nav1, "class", "main-header navbar navbar-expand");
    			set_style(nav1, "margin-left", /*navbar_margin*/ ctx[2] + "px");
    			set_style(nav1, "transition", "all 0.5s linear");
    			set_style(nav1, "padding", "0px 0px 18px 0px ");
    			set_style(nav1, "height", "auto");
    			set_style(nav1, "background-color", "#fff");
    			add_location(nav1, file$2, 275, 2, 8235);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, aside, anchor);
    			append_dev(aside, div6);
    			append_dev(div6, a0);
    			append_dev(a0, div2);
    			append_dev(div2, div0);
    			append_dev(div0, img0);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(div1, t2);
    			append_dev(div1, p1);
    			append_dev(div6, t4);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, a1);
    			append_dev(a1, img1);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, p2);
    			append_dev(div3, t7);
    			append_dev(div3, p3);
    			append_dev(div5, t9);
    			append_dev(div5, hr);
    			append_dev(div5, t10);
    			append_dev(div5, nav0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(nav0, null);
    			}

    			insert_dev(target, t11, anchor);
    			insert_dev(target, nav1, anchor);
    			append_dev(nav1, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, a2);
    			append_dev(a2, i0);
    			append_dev(nav1, t12);
    			append_dev(nav1, ul1);
    			append_dev(ul1, li1);
    			append_dev(li1, a3);
    			append_dev(a3, i1);
    			current = true;
    			dispose = listen_dev(a2, "click", /*toggleSidebar*/ ctx[3], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*navbar_item, toggleNav*/ 17) {
    				each_value = /*navbar_item*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(nav0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*sidebar_visible*/ 2) {
    				set_style(aside, "transform", "translateX(" + /*sidebar_visible*/ ctx[1] + "px)");
    			}

    			if (!current || dirty & /*navbar_margin*/ 4) {
    				set_style(nav1, "margin-left", /*navbar_margin*/ ctx[2] + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(aside);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(nav1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let opened_navbar_item_tree = null;

    	let navbar_item = [
    		{
    			nav_id: 0,
    			nav_body: "Dashboard",
    			nav_icon: "fa fa-tachometer-alt",
    			nav_child: [],
    			nav_to: "dashboard"
    		},
    		{
    			nav_id: 1,
    			nav_body: "Master Data",
    			nav_icon: "fa fa-database",
    			nav_show_child: false,
    			nav_child: [
    				{
    					nav_body: "Staf",
    					nav_icon: "fa fa-user",
    					nav_to: "staf"
    				},
    				{
    					nav_body: "Produk Kecantikan",
    					nav_icon: "fas fa-spa",
    					nav_to: "produkkecantikan"
    				},
    				{
    					nav_body: "Layanan",
    					nav_icon: "fa fa-handshake",
    					nav_to: "layanan"
    				},
    				{
    					nav_body: "Pasien",
    					nav_icon: "fa fa-address-book",
    					nav_to: "pasien"
    				}
    			]
    		},
    		{
    			nav_id: 2,
    			nav_body: "Pembelian",
    			nav_icon: "fas fa-cart-plus",
    			nav_child: [
    				{
    					nav_body: "Produk Kecantikan",
    					nav_icon: "fas fa-spa",
    					nav_to: "beli-produkkecantikan"
    				},
    				{
    					nav_body: "Inventaris",
    					nav_icon: "fa fa-cubes",
    					nav_to: "beli-inventaris"
    				}
    			]
    		},
    		{
    			nav_id: 3,
    			nav_body: "Penjualan",
    			nav_icon: "fas fa-cash-register",
    			nav_child: [
    				{
    					nav_body: "Kasir",
    					nav_icon: "fas fa-spa",
    					nav_to: "kasir"
    				},
    				{
    					nav_body: "Klinik",
    					nav_icon: "far fa-circle",
    					nav_to: "jasa"
    				},
    				{
    					nav_body: "Salon",
    					nav_icon: "far fa-circle",
    					nav_to: "jasa"
    				}
    			]
    		},
    		{
    			nav_id: 4,
    			nav_body: "Laporan",
    			nav_icon: "fas fa-print",
    			nav_child: [
    				{
    					nav_body: "Produk Kecantikan",
    					nav_icon: "far fa-circle",
    					nav_to: "produkkecantikan"
    				},
    				{
    					nav_body: "Jasa",
    					nav_icon: "far fa-circle",
    					nav_to: "jasa"
    				}
    			]
    		}
    	];

    	const dispatch = createEventDispatcher();
    	let container_margin = 0;
    	let sidebar_visible = 0;
    	let navbar_margin = 250;
    	let masterdatachild_visible = false;

    	// toggle sidebar
    	function toggleSidebar() {
    		if (sidebar_visible == 0) {
    			$$invalidate(2, navbar_margin = 0);
    			container_margin = 0;
    			dispatch("message", { text: container_margin });

    			setTimeout(
    				() => {
    					$$invalidate(1, sidebar_visible = -250);
    				},
    				100
    			);
    		} else {
    			$$invalidate(1, sidebar_visible = 0);

    			setTimeout(
    				() => {
    					container_margin = 250;
    					$$invalidate(2, navbar_margin = 250);
    					dispatch("message", { text: container_margin });
    				},
    				100
    			);
    		}
    	}

    	function toggleNav(parameter_arr_index) {
    		if (navbar_item[parameter_arr_index].nav_child.length) {
    			if (navbar_item[parameter_arr_index].nav_show_child == true) {
    				$$invalidate(0, navbar_item[parameter_arr_index].nav_show_child = false, navbar_item);
    				opened_navbar_item_tree = null;
    			} else {
    				// untuk menutup navbar tree lain yang sedang terbuka
    				if (opened_navbar_item_tree != null) {
    					$$invalidate(0, navbar_item[opened_navbar_item_tree].nav_show_child = false, navbar_item);
    				}

    				// menyimpan navbar terakhir yang dibuka
    				$$invalidate(0, navbar_item[parameter_arr_index].nav_show_child = true, navbar_item);

    				opened_navbar_item_tree = parameter_arr_index;
    			}
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Sidebar", $$slots, []);
    	const click_handler = nav_item => toggleNav(nav_item.nav_id);
    	const click_handler_1 = nav_item => toggleNav(nav_item.nav_id);

    	$$self.$capture_state = () => ({
    		Navbar,
    		fade,
    		fly,
    		slide,
    		Router,
    		Link,
    		Route,
    		createEventDispatcher,
    		opened_navbar_item_tree,
    		navbar_item,
    		dispatch,
    		container_margin,
    		sidebar_visible,
    		navbar_margin,
    		masterdatachild_visible,
    		toggleSidebar,
    		toggleNav
    	});

    	$$self.$inject_state = $$props => {
    		if ("opened_navbar_item_tree" in $$props) opened_navbar_item_tree = $$props.opened_navbar_item_tree;
    		if ("navbar_item" in $$props) $$invalidate(0, navbar_item = $$props.navbar_item);
    		if ("container_margin" in $$props) container_margin = $$props.container_margin;
    		if ("sidebar_visible" in $$props) $$invalidate(1, sidebar_visible = $$props.sidebar_visible);
    		if ("navbar_margin" in $$props) $$invalidate(2, navbar_margin = $$props.navbar_margin);
    		if ("masterdatachild_visible" in $$props) masterdatachild_visible = $$props.masterdatachild_visible;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		navbar_item,
    		sidebar_visible,
    		navbar_margin,
    		toggleSidebar,
    		toggleNav,
    		opened_navbar_item_tree,
    		container_margin,
    		dispatch,
    		masterdatachild_visible,
    		click_handler,
    		click_handler_1
    	];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\Component\TableViewer.svelte generated by Svelte v3.19.2 */

    const { console: console_1 } = globals;
    const file$3 = "src\\Component\\TableViewer.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	child_ctx[18] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	return child_ctx;
    }

    // (191:18) <Link to="{controller.name + "/" + controller.button.link}">
    function create_default_slot_3(ctx) {
    	let button;
    	let i;
    	let i_class_value;
    	let t0;
    	let t1_value = /*controller*/ ctx[0].button.text + "";
    	let t1;

    	const block = {
    		c: function create() {
    			button = element("button");
    			i = element("i");
    			t0 = space();
    			t1 = text(t1_value);
    			attr_dev(i, "class", i_class_value = "" + (/*controller*/ ctx[0].button.icon + " mr-2" + " svelte-1v56gq8"));
    			add_location(i, file$3, 192, 22, 5526);
    			attr_dev(button, "class", "btn btn-primary btn-round btn-md");
    			add_location(button, file$3, 191, 20, 5453);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, i);
    			append_dev(button, t0);
    			append_dev(button, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*controller*/ 1 && i_class_value !== (i_class_value = "" + (/*controller*/ ctx[0].button.icon + " mr-2" + " svelte-1v56gq8"))) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (dirty & /*controller*/ 1 && t1_value !== (t1_value = /*controller*/ ctx[0].button.text + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(191:18) <Link to=\\\"{controller.name + \\\"/\\\" + controller.button.link}\\\">",
    		ctx
    	});

    	return block;
    }

    // (202:22) {#each controller.table_header as table_title}
    function create_each_block_3(ctx) {
    	let th;
    	let t_value = /*table_title*/ ctx[22] + "";
    	let t;

    	const block = {
    		c: function create() {
    			th = element("th");
    			t = text(t_value);
    			add_location(th, file$3, 202, 24, 5922);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			append_dev(th, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*controller*/ 1 && t_value !== (t_value = /*table_title*/ ctx[22] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(202:22) {#each controller.table_header as table_title}",
    		ctx
    	});

    	return block;
    }

    // (209:22) {#if i >= active_first - 1 && i < active_last}
    function create_if_block$2(ctx) {
    	let tr;
    	let t0;
    	let td;
    	let current_block_type_index;
    	let if_block;
    	let t1;
    	let current;
    	let each_value_2 = /*parent_data*/ ctx[16];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const if_block_creators = [create_if_block_1$2, create_if_block_2$1, create_if_block_3$1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*action*/ ctx[1] == null) return 0;
    		if (/*action*/ ctx[1] != null && /*data_bind*/ ctx[2][/*i*/ ctx[18]][3].data == 0) return 1;
    		if (/*action*/ ctx[1] != null && /*data_bind*/ ctx[2][/*i*/ ctx[18]][3].data == 1) return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_1(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			td = element("td");
    			if (if_block) if_block.c();
    			t1 = space();
    			attr_dev(td, "class", "td-actions");
    			add_location(td, file$3, 225, 24, 7262);
    			add_location(tr, file$3, 209, 24, 6206);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t0);
    			append_dev(tr, td);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(td, null);
    			}

    			append_dev(tr, t1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data_bind, formatRupiah, formatTanggal*/ 4) {
    				each_value_2 = /*parent_data*/ ctx[16];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t0);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(td, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(209:22) {#if i >= active_first - 1 && i < active_last}",
    		ctx
    	});

    	return block;
    }

    // (222:60) 
    function create_if_block_9(ctx) {
    	let td;
    	let t_value = /*i*/ ctx[18] + 1 + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			add_location(td, file$3, 222, 28, 7156);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(222:60) ",
    		ctx
    	});

    	return block;
    }

    // (220:64) 
    function create_if_block_8(ctx) {
    	let td;
    	let t_value = formatTanggal(/*child_data*/ ctx[19].data) + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			add_location(td, file$3, 220, 28, 7023);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data_bind*/ 4 && t_value !== (t_value = formatTanggal(/*child_data*/ ctx[19].data) + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(220:64) ",
    		ctx
    	});

    	return block;
    }

    // (218:62) 
    function create_if_block_7(ctx) {
    	let td;
    	let t_value = /*child_data*/ ctx[19].data + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			add_location(td, file$3, 218, 28, 6901);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data_bind*/ 4 && t_value !== (t_value = /*child_data*/ ctx[19].data + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(218:62) ",
    		ctx
    	});

    	return block;
    }

    // (216:69) 
    function create_if_block_6(ctx) {
    	let td;
    	let span;
    	let t_value = /*child_data*/ ctx[19].value + "";
    	let t;
    	let span_class_value;

    	const block = {
    		c: function create() {
    			td = element("td");
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", span_class_value = "" + (null_to_empty(/*child_data*/ ctx[19].class) + " svelte-1v56gq8"));
    			set_style(span, "font-size", "16px");
    			add_location(span, file$3, 216, 32, 6720);
    			add_location(td, file$3, 216, 28, 6716);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, span);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data_bind*/ 4 && t_value !== (t_value = /*child_data*/ ctx[19].value + "")) set_data_dev(t, t_value);

    			if (dirty & /*data_bind*/ 4 && span_class_value !== (span_class_value = "" + (null_to_empty(/*child_data*/ ctx[19].class) + " svelte-1v56gq8"))) {
    				attr_dev(span, "class", span_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(216:69) ",
    		ctx
    	});

    	return block;
    }

    // (214:63) 
    function create_if_block_5(ctx) {
    	let td;
    	let span;
    	let t_value = /*child_data*/ ctx[19].data + "";
    	let t;
    	let span_class_value;

    	const block = {
    		c: function create() {
    			td = element("td");
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", span_class_value = "" + (null_to_empty(/*child_data*/ ctx[19].class) + " svelte-1v56gq8"));
    			set_style(span, "font-size", "16px");
    			add_location(span, file$3, 214, 32, 6529);
    			add_location(td, file$3, 214, 28, 6525);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, span);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data_bind*/ 4 && t_value !== (t_value = /*child_data*/ ctx[19].data + "")) set_data_dev(t, t_value);

    			if (dirty & /*data_bind*/ 4 && span_class_value !== (span_class_value = "" + (null_to_empty(/*child_data*/ ctx[19].class) + " svelte-1v56gq8"))) {
    				attr_dev(span, "class", span_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(214:63) ",
    		ctx
    	});

    	return block;
    }

    // (212:26) {#if child_data.type == "price"}
    function create_if_block_4$1(ctx) {
    	let td;
    	let t0;
    	let t1_value = formatRupiah(/*child_data*/ ctx[19].data) + "";
    	let t1;
    	let td_class_value;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t0 = text("Rp. ");
    			t1 = text(t1_value);
    			attr_dev(td, "class", td_class_value = "" + (null_to_empty(/*child_data*/ ctx[19].class) + " svelte-1v56gq8"));
    			add_location(td, file$3, 212, 28, 6359);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t0);
    			append_dev(td, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data_bind*/ 4 && t1_value !== (t1_value = formatRupiah(/*child_data*/ ctx[19].data) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*data_bind*/ 4 && td_class_value !== (td_class_value = "" + (null_to_empty(/*child_data*/ ctx[19].class) + " svelte-1v56gq8"))) {
    				attr_dev(td, "class", td_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(212:26) {#if child_data.type == \\\"price\\\"}",
    		ctx
    	});

    	return block;
    }

    // (211:24) {#each parent_data as child_data}
    function create_each_block_2(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*child_data*/ ctx[19].type == "price") return create_if_block_4$1;
    		if (/*child_data*/ ctx[19].type == "badge") return create_if_block_5;
    		if (/*child_data*/ ctx[19].type == "badge_radio") return create_if_block_6;
    		if (/*child_data*/ ctx[19].type == "text") return create_if_block_7;
    		if (/*child_data*/ ctx[19].type == "date") return create_if_block_8;
    		if (/*child_data*/ ctx[19].type == "id") return create_if_block_9;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(211:24) {#each parent_data as child_data}",
    		ctx
    	});

    	return block;
    }

    // (239:80) 
    function create_if_block_3$1(ctx) {
    	let current;

    	const link = new Link({
    			props: {
    				to: /*controller*/ ctx[0].name + "/" + /*parent_data*/ ctx[16][0].data,
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(link.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(link, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const link_changes = {};
    			if (dirty & /*controller, data_bind*/ 5) link_changes.to = /*controller*/ ctx[0].name + "/" + /*parent_data*/ ctx[16][0].data;

    			if (dirty & /*$$scope*/ 33554432) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(link, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(239:80) ",
    		ctx
    	});

    	return block;
    }

    // (233:80) 
    function create_if_block_2$1(ctx) {
    	let current;

    	const link = new Link({
    			props: {
    				to: /*controller*/ ctx[0].name + "/" + /*parent_data*/ ctx[16][0].data,
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(link.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(link, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const link_changes = {};
    			if (dirty & /*controller, data_bind*/ 5) link_changes.to = /*controller*/ ctx[0].name + "/" + /*parent_data*/ ctx[16][0].data;

    			if (dirty & /*$$scope*/ 33554432) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(link, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(233:80) ",
    		ctx
    	});

    	return block;
    }

    // (227:26) {#if action == null}
    function create_if_block_1$2(ctx) {
    	let current;

    	const link = new Link({
    			props: {
    				to: /*controller*/ ctx[0].name + "/edit/" + /*parent_data*/ ctx[16][0].data,
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(link.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(link, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const link_changes = {};
    			if (dirty & /*controller, data_bind*/ 5) link_changes.to = /*controller*/ ctx[0].name + "/edit/" + /*parent_data*/ ctx[16][0].data;

    			if (dirty & /*$$scope*/ 33554432) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(link, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(227:26) {#if action == null}",
    		ctx
    	});

    	return block;
    }

    // (240:28) <Link to="{controller.name + "/" + parent_data[0].data}">
    function create_default_slot_2(ctx) {
    	let button;
    	let i;

    	const block = {
    		c: function create() {
    			button = element("button");
    			i = element("i");
    			attr_dev(i, "class", "fa fa-print pt-1");
    			add_location(i, file$3, 241, 32, 8514);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "rel", "tooltip");
    			attr_dev(button, "class", "btn btn-success btn-icon btn-sm");
    			attr_dev(button, "data-original-title", "");
    			attr_dev(button, "title", "");
    			add_location(button, file$3, 240, 30, 8372);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, i);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(240:28) <Link to=\\\"{controller.name + \\\"/\\\" + parent_data[0].data}\\\">",
    		ctx
    	});

    	return block;
    }

    // (234:28) <Link to="{controller.name + "/" + parent_data[0].data}">
    function create_default_slot_1$1(ctx) {
    	let button;
    	let i;

    	const block = {
    		c: function create() {
    			button = element("button");
    			i = element("i");
    			attr_dev(i, "class", "fa fa-pencil-ruler pt-1");
    			add_location(i, file$3, 235, 32, 8054);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "rel", "tooltip");
    			attr_dev(button, "class", "btn btn-info btn-icon btn-sm");
    			attr_dev(button, "data-original-title", "");
    			attr_dev(button, "title", "");
    			add_location(button, file$3, 234, 30, 7915);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, i);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(234:28) <Link to=\\\"{controller.name + \\\"/\\\" + parent_data[0].data}\\\">",
    		ctx
    	});

    	return block;
    }

    // (228:28) <Link to="{controller.name + "/edit/" + parent_data[0].data}">
    function create_default_slot$1(ctx) {
    	let button;
    	let i;

    	const block = {
    		c: function create() {
    			button = element("button");
    			i = element("i");
    			attr_dev(i, "class", "fa fa-pencil-ruler pt-1");
    			add_location(i, file$3, 229, 32, 7597);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "rel", "tooltip");
    			attr_dev(button, "class", "btn btn-info btn-icon btn-sm ");
    			attr_dev(button, "data-original-title", "");
    			attr_dev(button, "title", "");
    			add_location(button, file$3, 228, 30, 7457);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, i);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(228:28) <Link to=\\\"{controller.name + \\\"/edit/\\\" + parent_data[0].data}\\\">",
    		ctx
    	});

    	return block;
    }

    // (208:20) {#each data_bind as parent_data, i}
    function create_each_block_1$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*i*/ ctx[18] >= /*active_first*/ ctx[5] - 1 && /*i*/ ctx[18] < /*active_last*/ ctx[6] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*i*/ ctx[18] >= /*active_first*/ ctx[5] - 1 && /*i*/ ctx[18] < /*active_last*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(208:20) {#each data_bind as parent_data, i}",
    		ctx
    	});

    	return block;
    }

    // (259:8) {#each num_of_page as page}
    function create_each_block$1(ctx) {
    	let li;
    	let a;
    	let t_value = /*page*/ ctx[13] + "";
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "class", "page-link");
    			add_location(a, file$3, 259, 99, 9346);
    			attr_dev(li, "class", "page-item");
    			toggle_class(li, "active", /*active_now*/ ctx[7] === /*page*/ ctx[13]);
    			add_location(li, file$3, 259, 10, 9257);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t);

    			dispose = listen_dev(
    				li,
    				"click",
    				function () {
    					if (is_function(/*choosePage*/ ctx[8](/*page*/ ctx[13]))) /*choosePage*/ ctx[8](/*page*/ ctx[13]).apply(this, arguments);
    				},
    				false,
    				false,
    				false
    			);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*num_of_page*/ 16 && t_value !== (t_value = /*page*/ ctx[13] + "")) set_data_dev(t, t_value);

    			if (dirty & /*active_now, num_of_page*/ 144) {
    				toggle_class(li, "active", /*active_now*/ ctx[7] === /*page*/ ctx[13]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(259:8) {#each num_of_page as page}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let section;
    	let div10;
    	let div9;
    	let div8;
    	let div7;
    	let div6;
    	let div1;
    	let i0;
    	let i0_class_value;
    	let t0;
    	let div0;
    	let h5;
    	let t1_value = /*controller*/ ctx[0].title + "";
    	let t1;
    	let t2;
    	let p;
    	let t3_value = /*controller*/ ctx[0].sub_title + "";
    	let t3;
    	let t4;
    	let div5;
    	let div4;
    	let div3;
    	let input;
    	let t5;
    	let div2;
    	let span;
    	let i1;
    	let t6;
    	let t7;
    	let table;
    	let thead;
    	let tr;
    	let t8;
    	let tbody;
    	let t9;
    	let nav;
    	let ul;
    	let current;
    	let dispose;

    	const link = new Link({
    			props: {
    				to: /*controller*/ ctx[0].name + "/" + /*controller*/ ctx[0].button.link,
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let each_value_3 = /*controller*/ ctx[0].table_header;
    	validate_each_argument(each_value_3);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_2[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_1 = /*data_bind*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let each_value = /*num_of_page*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			div10 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			div1 = element("div");
    			i0 = element("i");
    			t0 = space();
    			div0 = element("div");
    			h5 = element("h5");
    			t1 = text(t1_value);
    			t2 = space();
    			p = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			input = element("input");
    			t5 = space();
    			div2 = element("div");
    			span = element("span");
    			i1 = element("i");
    			t6 = space();
    			create_component(link.$$.fragment);
    			t7 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t8 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t9 = space();
    			nav = element("nav");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(i0, "class", i0_class_value = "" + (/*controller*/ ctx[0].icon + " mr-3 mt-3" + " svelte-1v56gq8"));
    			add_location(i0, file$3, 175, 18, 4594);
    			attr_dev(h5, "class", "mb-0");
    			add_location(h5, file$3, 177, 20, 4684);
    			attr_dev(p, "class", "mt-1");
    			add_location(p, file$3, 178, 20, 4746);
    			add_location(div0, file$3, 176, 18, 4657);
    			attr_dev(div1, "class", "page-heading svelte-1v56gq8");
    			add_location(div1, file$3, 174, 16, 4548);
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "placeholder", "Cari disini..");
    			attr_dev(input, "type", "text");
    			add_location(input, file$3, 184, 22, 5003);
    			set_style(i1, "cursor", "pointer");
    			attr_dev(i1, "class", "fa fa-search");
    			add_location(i1, file$3, 186, 55, 5207);
    			attr_dev(span, "class", "input-group-text");
    			add_location(span, file$3, 186, 24, 5176);
    			attr_dev(div2, "class", "input-group-append");
    			add_location(div2, file$3, 185, 22, 5118);
    			attr_dev(div3, "class", "input-group");
    			add_location(div3, file$3, 183, 20, 4954);
    			attr_dev(div4, "class", "form-group mr-2");
    			add_location(div4, file$3, 182, 18, 4903);
    			attr_dev(div5, "class", "heading-tools svelte-1v56gq8");
    			add_location(div5, file$3, 181, 16, 4856);
    			attr_dev(div6, "class", "card-header");
    			add_location(div6, file$3, 173, 14, 4505);
    			add_location(tr, file$3, 200, 20, 5822);
    			add_location(thead, file$3, 199, 16, 5793);
    			add_location(tbody, file$3, 206, 16, 6046);
    			attr_dev(table, "class", "table");
    			add_location(table, file$3, 198, 14, 5754);
    			attr_dev(div7, "class", "card card-primary card-outline");
    			add_location(div7, file$3, 172, 12, 4445);
    			attr_dev(div8, "class", "col-md-12");
    			add_location(div8, file$3, 171, 10, 4408);
    			attr_dev(div9, "class", "row");
    			add_location(div9, file$3, 170, 8, 4379);
    			attr_dev(div10, "class", "container-fluid");
    			add_location(div10, file$3, 169, 6, 4340);
    			attr_dev(section, "class", "content");
    			add_location(section, file$3, 168, 4, 4307);
    			attr_dev(ul, "class", "pagination pagination-lg");
    			add_location(ul, file$3, 257, 6, 9171);
    			attr_dev(nav, "style", "position: absolute;right: 100px;margin-top: 12px;}");
    			add_location(nav, file$3, 256, 4, 9099);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div1);
    			append_dev(div1, i0);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, h5);
    			append_dev(h5, t1);
    			append_dev(div0, t2);
    			append_dev(div0, p);
    			append_dev(p, t3);
    			append_dev(div6, t4);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, input);
    			set_input_value(input, /*searchBox*/ ctx[3]);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, span);
    			append_dev(span, i1);
    			append_dev(div5, t6);
    			mount_component(link, div5, null);
    			append_dev(div7, t7);
    			append_dev(div7, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(tr, null);
    			}

    			append_dev(table, t8);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(tbody, null);
    			}

    			insert_dev(target, t9, anchor);
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    			dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[12]);
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*controller*/ 1 && i0_class_value !== (i0_class_value = "" + (/*controller*/ ctx[0].icon + " mr-3 mt-3" + " svelte-1v56gq8"))) {
    				attr_dev(i0, "class", i0_class_value);
    			}

    			if ((!current || dirty & /*controller*/ 1) && t1_value !== (t1_value = /*controller*/ ctx[0].title + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*controller*/ 1) && t3_value !== (t3_value = /*controller*/ ctx[0].sub_title + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*searchBox*/ 8 && input.value !== /*searchBox*/ ctx[3]) {
    				set_input_value(input, /*searchBox*/ ctx[3]);
    			}

    			const link_changes = {};
    			if (dirty & /*controller*/ 1) link_changes.to = /*controller*/ ctx[0].name + "/" + /*controller*/ ctx[0].button.link;

    			if (dirty & /*$$scope, controller*/ 33554433) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);

    			if (dirty & /*controller*/ 1) {
    				each_value_3 = /*controller*/ ctx[0].table_header;
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_3(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(tr, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_3.length;
    			}

    			if (dirty & /*controller, data_bind, action, formatRupiah, formatTanggal, active_first, active_last*/ 103) {
    				each_value_1 = /*data_bind*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(tbody, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*active_now, num_of_page, choosePage*/ 400) {
    				each_value = /*num_of_page*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(link);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(nav);
    			destroy_each(each_blocks, detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function formatRupiah(angka, prefix) {
    	var number_string = angka.replace(/[^,\d]/g, "").toString();
    	var split = number_string.split(",");
    	var sisa = split[0].length % 3;
    	var rupiah = split[0].substr(0, sisa);
    	var ribuan = split[0].substr(sisa).match(/\d{3}/gi);
    	var separator;

    	// tambahkan titik jika yang di input sudah menjadi angka ribuan
    	if (ribuan) {
    		separator = sisa ? "." : "";
    		rupiah += separator + ribuan.join(".");
    	}

    	rupiah = split[1] != undefined ? rupiah + "," + split[1] : rupiah;

    	return prefix == undefined
    	? rupiah
    	: rupiah ? "Rp. " + rupiah : "";
    }

    function formatTanggal(formattedtanggal) {
    	var format = formattedtanggal.toString();
    	format = format.split("-");
    	console.log(format);
    	var bulan = 0;

    	// mapping bulan
    	switch (format[1]) {
    		case "01":
    			bulan = "Januari";
    			break;
    		case "02":
    			bulan = "Februari";
    			break;
    		case "03":
    			bulan = "Maret";
    			break;
    		case "04":
    			bulan = "April";
    			break;
    		case "05":
    			bulan = "Mei";
    			break;
    		case "06":
    			bulan = "Juni";
    			break;
    		case "07":
    			bulan = "Juli";
    			break;
    		case "08":
    			bulan = "Agustus";
    			break;
    		case "09":
    			bulan = "September";
    			break;
    		case "10":
    			bulan = "Oktober";
    			break;
    		case "11":
    			bulan = "November";
    			break;
    		case "12":
    			bulan = "Desember";
    			break;
    	}

    	return format[2] + " " + bulan + " " + format[0];
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { controller } = $$props;
    	let { action = null } = $$props;
    	let data_bind = [];
    	let data_raw = [];
    	let searchBox = "";
    	let num_of_page = [];
    	let active_first = 1;
    	let active_last = 15;
    	let active_now = 1;
    	let per_page_date = 15;

    	// on mount
    	onMount(async () => {
    		fetch(controller.apiUrl, { method: "GET" }).then(res => res.json()).then(data => {
    			$$invalidate(9, data_raw = data);
    			bindPage(data_raw.length);
    			console.log(data_raw);
    		}).catch(err => {
    			
    		});
    	});

    	function bindPage(amount_of_data) {
    		let i = 0;
    		$$invalidate(4, num_of_page = []);

    		while (amount_of_data >= per_page_date) {
    			i = i + 1;
    			num_of_page.push(i);
    			amount_of_data -= per_page_date;
    		}

    		if (amount_of_data < per_page_date) {
    			i = i + 1;
    			num_of_page.push(i);
    		}

    		console.log(num_of_page);
    	}

    	function choosePage(page) {
    		if (page == 1) {
    			$$invalidate(5, active_first = 1);
    			$$invalidate(6, active_last = 15);
    		} else {
    			$$invalidate(5, active_first = (page - 1) * per_page_date + 1);
    			$$invalidate(6, active_last = page * per_page_date);
    		}

    		$$invalidate(7, active_now = page);
    		console.log(active_first);
    		console.log(active_last);
    	}

    	const writable_props = ["controller", "action"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<TableViewer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TableViewer", $$slots, []);

    	function input_input_handler() {
    		searchBox = this.value;
    		$$invalidate(3, searchBox);
    	}

    	$$self.$set = $$props => {
    		if ("controller" in $$props) $$invalidate(0, controller = $$props.controller);
    		if ("action" in $$props) $$invalidate(1, action = $$props.action);
    	};

    	$$self.$capture_state = () => ({
    		controller,
    		action,
    		Router,
    		Link,
    		Route,
    		onMount,
    		data_bind,
    		data_raw,
    		searchBox,
    		num_of_page,
    		active_first,
    		active_last,
    		active_now,
    		per_page_date,
    		formatRupiah,
    		formatTanggal,
    		bindPage,
    		choosePage
    	});

    	$$self.$inject_state = $$props => {
    		if ("controller" in $$props) $$invalidate(0, controller = $$props.controller);
    		if ("action" in $$props) $$invalidate(1, action = $$props.action);
    		if ("data_bind" in $$props) $$invalidate(2, data_bind = $$props.data_bind);
    		if ("data_raw" in $$props) $$invalidate(9, data_raw = $$props.data_raw);
    		if ("searchBox" in $$props) $$invalidate(3, searchBox = $$props.searchBox);
    		if ("num_of_page" in $$props) $$invalidate(4, num_of_page = $$props.num_of_page);
    		if ("active_first" in $$props) $$invalidate(5, active_first = $$props.active_first);
    		if ("active_last" in $$props) $$invalidate(6, active_last = $$props.active_last);
    		if ("active_now" in $$props) $$invalidate(7, active_now = $$props.active_now);
    		if ("per_page_date" in $$props) per_page_date = $$props.per_page_date;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*searchBox, data_raw, controller, data_bind*/ 525) {
    			// search controller
    			 {
    				if (searchBox != "" && data_raw != []) {
    					// reset page
    					$$invalidate(5, active_first = 1);

    					$$invalidate(6, active_last = 15);
    					$$invalidate(7, active_now = 1);
    					$$invalidate(2, data_bind = []);
    					let i = 0;
    					let counter = 0;

    					for (i = 0; i < searchBox.length; i++) {
    						for (let j = 0; j < data_raw.length; j++) {
    							let confirmed = 0;
    							let name = data_raw[j][controller.search_selector]["data"];

    							for (let c = 0; c < searchBox.length; c++) {
    								if (searchBox[c].toLowerCase() == name[c].toLowerCase()) {
    									confirmed = 1;
    								} else {
    									confirmed = 0;
    									break;
    								}
    							}

    							if (confirmed == 1) {
    								$$invalidate(2, data_bind[counter] = data_raw[j], data_bind);
    								counter++;
    							}
    						}

    						counter = 0;
    					}

    					console.log("Found " + counter + " matchs");
    				} else if (searchBox == "" && data_raw != []) {
    					$$invalidate(2, data_bind = data_raw);
    				}

    				// menghitung jumlah page yang akan digunakan
    				bindPage(data_bind.length);
    			}
    		}
    	};

    	return [
    		controller,
    		action,
    		data_bind,
    		searchBox,
    		num_of_page,
    		active_first,
    		active_last,
    		active_now,
    		choosePage,
    		data_raw,
    		per_page_date,
    		bindPage,
    		input_input_handler
    	];
    }

    class TableViewer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { controller: 0, action: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TableViewer",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*controller*/ ctx[0] === undefined && !("controller" in props)) {
    			console_1.warn("<TableViewer> was created without expected prop 'controller'");
    		}
    	}

    	get controller() {
    		throw new Error("<TableViewer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set controller(value) {
    		throw new Error("<TableViewer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get action() {
    		throw new Error("<TableViewer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set action(value) {
    		throw new Error("<TableViewer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\Staf.svelte generated by Svelte v3.19.2 */
    const file$4 = "src\\Pages\\Staf.svelte";

    // (49:40) <Link to = "dashboard">
    function create_default_slot$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Dashboard");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(49:40) <Link to = \\\"dashboard\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div4;
    	let section;
    	let div3;
    	let div2;
    	let div0;
    	let h1;
    	let t0;
    	let div1;
    	let ol;
    	let li0;
    	let t1;
    	let li1;
    	let t3;
    	let current;

    	const link = new Link({
    			props: {
    				to: "dashboard",
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tableviewer = new TableViewer({
    			props: { controller: /*controller*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			section = element("section");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = space();
    			div1 = element("div");
    			ol = element("ol");
    			li0 = element("li");
    			create_component(link.$$.fragment);
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "Staf";
    			t3 = space();
    			create_component(tableviewer.$$.fragment);
    			add_location(h1, file$4, 44, 10, 1173);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$4, 43, 8, 1139);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$4, 48, 12, 1294);
    			attr_dev(li1, "class", "breadcrumb-item active");
    			add_location(li1, file$4, 49, 12, 1380);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$4, 47, 10, 1242);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$4, 46, 8, 1208);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$4, 42, 6, 1107);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$4, 41, 4, 1070);
    			attr_dev(section, "class", "content-header");
    			add_location(section, file$4, 40, 2, 1032);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$4, 38, 0, 964);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, section);
    			append_dev(section, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, ol);
    			append_dev(ol, li0);
    			mount_component(link, li0, null);
    			append_dev(ol, t1);
    			append_dev(ol, li1);
    			append_dev(div4, t3);
    			mount_component(tableviewer, div4, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			transition_in(tableviewer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			transition_out(tableviewer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(link);
    			destroy_component(tableviewer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { apiBaseUrl = "http://127.0.0.1/lumeraAPI" } = $$props;

    	let controller = {
    		name: "staf",
    		title: "Daftar Staf",
    		sub_title: "Kelola staf disini",
    		icon: "fa fa-users",
    		search_selector: 1,
    		button: {
    			text: "Tambah Staf",
    			icon: "fa fa-plus",
    			link: "tambah"
    		},
    		table_header: ["#", "Nama Lengkap", "Posisi", "Status", "Aksi"],
    		apiUrl: apiBaseUrl + "/master_data/getAllStaff.php"
    	};

    	const writable_props = ["apiBaseUrl"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Staf> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Staf", $$slots, []);

    	$$self.$set = $$props => {
    		if ("apiBaseUrl" in $$props) $$invalidate(1, apiBaseUrl = $$props.apiBaseUrl);
    	};

    	$$self.$capture_state = () => ({
    		apiBaseUrl,
    		Router,
    		Link,
    		Route,
    		onMount,
    		TableViewer,
    		controller
    	});

    	$$self.$inject_state = $$props => {
    		if ("apiBaseUrl" in $$props) $$invalidate(1, apiBaseUrl = $$props.apiBaseUrl);
    		if ("controller" in $$props) $$invalidate(0, controller = $$props.controller);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [controller, apiBaseUrl];
    }

    class Staf extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { apiBaseUrl: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Staf",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get apiBaseUrl() {
    		throw new Error("<Staf>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set apiBaseUrl(value) {
    		throw new Error("<Staf>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Component\InputEditForm.svelte generated by Svelte v3.19.2 */

    const { console: console_1$1 } = globals;
    const file$5 = "src\\Component\\InputEditForm.svelte";

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	return child_ctx;
    }

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[16] = list;
    	child_ctx[17] = i;
    	return child_ctx;
    }

    function get_each_context_3$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	return child_ctx;
    }

    // (140:41) <Link to = "{bread.link}">
    function create_default_slot_1$2(ctx) {
    	let t_value = /*bread*/ ctx[23].value + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*formController*/ 1 && t_value !== (t_value = /*bread*/ ctx[23].value + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(140:41) <Link to = \\\"{bread.link}\\\">",
    		ctx
    	});

    	return block;
    }

    // (139:12) {#each formController.breadcrumb as bread}
    function create_each_block_3$1(ctx) {
    	let li;
    	let current;

    	const link = new Link({
    			props: {
    				to: /*bread*/ ctx[23].link,
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			li = element("li");
    			create_component(link.$$.fragment);
    			attr_dev(li, "class", "breadcrumb-item");
    			add_location(li, file$5, 139, 13, 3569);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(link, li, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const link_changes = {};
    			if (dirty & /*formController*/ 1) link_changes.to = /*bread*/ ctx[23].link;

    			if (dirty & /*$$scope, formController*/ 67108865) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(link);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3$1.name,
    		type: "each",
    		source: "(139:12) {#each formController.breadcrumb as bread}",
    		ctx
    	});

    	return block;
    }

    // (160:18) <Link to="{formController.breadcrumb[formController.breadcrumb.length - 1].link}">
    function create_default_slot$3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "BATAL";
    			attr_dev(p, "class", "btn btn-danger");
    			add_location(p, file$5, 159, 100, 4444);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(160:18) <Link to=\\\"{formController.breadcrumb[formController.breadcrumb.length - 1].link}\\\">",
    		ctx
    	});

    	return block;
    }

    // (170:21) {#if input.required == true}
    function create_if_block_9$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "*";
    			set_style(span, "color", "red");
    			add_location(span, file$5, 170, 22, 4923);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9$1.name,
    		type: "if",
    		source: "(170:21) {#if input.required == true}",
    		ctx
    	});

    	return block;
    }

    // (205:42) 
    function create_if_block_8$1(ctx) {
    	let each_1_anchor;
    	let each_value_2 = /*input*/ ctx[15].option;
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*formController*/ 1) {
    				each_value_2 = /*input*/ ctx[15].option;
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8$1.name,
    		type: "if",
    		source: "(205:42) ",
    		ctx
    	});

    	return block;
    }

    // (196:47) 
    function create_if_block_7$1(ctx) {
    	let select;
    	let option;
    	let dispose;
    	let each_value_1 = /*input*/ ctx[15].option;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	function select_change_handler() {
    		/*select_change_handler*/ ctx[12].call(select, /*input*/ ctx[15]);
    	}

    	const block = {
    		c: function create() {
    			select = element("select");
    			option = element("option");
    			option.textContent = "-PILIH-";

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			option.selected = true;
    			option.disabled = true;
    			option.__value = "-PILIH-";
    			option.value = option.__value;
    			add_location(option, file$5, 197, 25, 6594);
    			attr_dev(select, "class", "form-control");
    			if (/*input*/ ctx[15].text === void 0) add_render_callback(select_change_handler);
    			add_location(select, file$5, 196, 11, 6514);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);
    			append_dev(select, option);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*input*/ ctx[15].text);
    			dispose = listen_dev(select, "change", select_change_handler);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*formController*/ 1) {
    				each_value_1 = /*input*/ ctx[15].option;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty & /*formController*/ 1) {
    				select_option(select, /*input*/ ctx[15].text);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7$1.name,
    		type: "if",
    		source: "(196:47) ",
    		ctx
    	});

    	return block;
    }

    // (191:45) 
    function create_if_block_6$1(ctx) {
    	let input0;
    	let input0_required_value;
    	let input0_placeholder_value;
    	let input0_updating = false;
    	let t;
    	let input1;
    	let input1_value_value;
    	let dispose;

    	function input0_input_handler() {
    		input0_updating = true;
    		/*input0_input_handler*/ ctx[11].call(input0, /*input*/ ctx[15]);
    	}

    	const block = {
    		c: function create() {
    			input0 = element("input");
    			t = space();
    			input1 = element("input");
    			attr_dev(input0, "type", "number");
    			input0.required = input0_required_value = /*input*/ ctx[15].required;
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "service");
    			attr_dev(input0, "placeholder", input0_placeholder_value = /*input*/ ctx[15].placeholder);
    			add_location(input0, file$5, 191, 11, 6106);
    			attr_dev(input1, "type", "text");
    			set_style(input1, "margin-top", "10px");
    			input1.disabled = "true";
    			input1.value = input1_value_value = formatRupiah$1(/*input*/ ctx[15].text, "Rp");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "id", "service");
    			attr_dev(input1, "placeholder", "Rp. 0");
    			add_location(input1, file$5, 192, 11, 6258);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input0, anchor);
    			set_input_value(input0, /*input*/ ctx[15].text);
    			insert_dev(target, t, anchor);
    			insert_dev(target, input1, anchor);
    			dispose = listen_dev(input0, "input", input0_input_handler);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*formController*/ 1 && input0_required_value !== (input0_required_value = /*input*/ ctx[15].required)) {
    				prop_dev(input0, "required", input0_required_value);
    			}

    			if (dirty & /*formController*/ 1 && input0_placeholder_value !== (input0_placeholder_value = /*input*/ ctx[15].placeholder)) {
    				attr_dev(input0, "placeholder", input0_placeholder_value);
    			}

    			if (!input0_updating && dirty & /*formController*/ 1) {
    				set_input_value(input0, /*input*/ ctx[15].text);
    			}

    			input0_updating = false;

    			if (dirty & /*formController*/ 1 && input1_value_value !== (input1_value_value = formatRupiah$1(/*input*/ ctx[15].text, "Rp")) && input1.value !== input1_value_value) {
    				prop_dev(input1, "value", input1_value_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(input1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$1.name,
    		type: "if",
    		source: "(191:45) ",
    		ctx
    	});

    	return block;
    }

    // (187:41) 
    function create_if_block_5$1(ctx) {
    	let input;
    	let input_required_value;
    	let dispose;

    	function input_input_handler_2() {
    		/*input_input_handler_2*/ ctx[10].call(input, /*input*/ ctx[15]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "date");
    			input.required = input_required_value = /*input*/ ctx[15].required;
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "id", "service");
    			add_location(input, file$5, 187, 11, 5893);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*input*/ ctx[15].text);
    			dispose = listen_dev(input, "input", input_input_handler_2);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*formController*/ 1 && input_required_value !== (input_required_value = /*input*/ ctx[15].required)) {
    				prop_dev(input, "required", input_required_value);
    			}

    			if (dirty & /*formController*/ 1) {
    				set_input_value(input, /*input*/ ctx[15].text);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(187:41) ",
    		ctx
    	});

    	return block;
    }

    // (184:43) 
    function create_if_block_4$2(ctx) {
    	let input;
    	let input_required_value;
    	let input_placeholder_value;
    	let input_updating = false;
    	let dispose;

    	function input_input_handler_1() {
    		input_updating = true;
    		/*input_input_handler_1*/ ctx[9].call(input, /*input*/ ctx[15]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "number");
    			input.required = input_required_value = /*input*/ ctx[15].required;
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "id", "service");
    			attr_dev(input, "placeholder", input_placeholder_value = /*input*/ ctx[15].placeholder);
    			add_location(input, file$5, 184, 11, 5695);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*input*/ ctx[15].text);
    			dispose = listen_dev(input, "input", input_input_handler_1);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*formController*/ 1 && input_required_value !== (input_required_value = /*input*/ ctx[15].required)) {
    				prop_dev(input, "required", input_required_value);
    			}

    			if (dirty & /*formController*/ 1 && input_placeholder_value !== (input_placeholder_value = /*input*/ ctx[15].placeholder)) {
    				attr_dev(input, "placeholder", input_placeholder_value);
    			}

    			if (!input_updating && dirty & /*formController*/ 1) {
    				set_input_value(input, /*input*/ ctx[15].text);
    			}

    			input_updating = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$2.name,
    		type: "if",
    		source: "(184:43) ",
    		ctx
    	});

    	return block;
    }

    // (180:54) 
    function create_if_block_3$2(ctx) {
    	let textarea;
    	let textarea_required_value;
    	let textarea_disabled_value;
    	let textarea_placeholder_value;
    	let dispose;

    	function textarea_input_handler() {
    		/*textarea_input_handler*/ ctx[8].call(textarea, /*input*/ ctx[15]);
    	}

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			textarea.required = textarea_required_value = /*input*/ ctx[15].required;
    			textarea.disabled = textarea_disabled_value = /*input*/ ctx[15].disabled;
    			attr_dev(textarea, "class", "form-control");
    			attr_dev(textarea, "id", "service");
    			attr_dev(textarea, "placeholder", textarea_placeholder_value = /*input*/ ctx[15].placeholder);
    			add_location(textarea, file$5, 180, 14, 5435);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    			set_input_value(textarea, /*input*/ ctx[15].text);
    			dispose = listen_dev(textarea, "input", textarea_input_handler);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*formController*/ 1 && textarea_required_value !== (textarea_required_value = /*input*/ ctx[15].required)) {
    				prop_dev(textarea, "required", textarea_required_value);
    			}

    			if (dirty & /*formController*/ 1 && textarea_disabled_value !== (textarea_disabled_value = /*input*/ ctx[15].disabled)) {
    				prop_dev(textarea, "disabled", textarea_disabled_value);
    			}

    			if (dirty & /*formController*/ 1 && textarea_placeholder_value !== (textarea_placeholder_value = /*input*/ ctx[15].placeholder)) {
    				attr_dev(textarea, "placeholder", textarea_placeholder_value);
    			}

    			if (dirty & /*formController*/ 1) {
    				set_input_value(textarea, /*input*/ ctx[15].text);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(180:54) ",
    		ctx
    	});

    	return block;
    }

    // (176:19) {#if input.type == "text"}
    function create_if_block_2$2(ctx) {
    	let input;
    	let input_required_value;
    	let input_disabled_value;
    	let input_placeholder_value;
    	let dispose;

    	function input_input_handler() {
    		/*input_input_handler*/ ctx[7].call(input, /*input*/ ctx[15]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "text");
    			input.required = input_required_value = /*input*/ ctx[15].required;
    			input.disabled = input_disabled_value = /*input*/ ctx[15].disabled;
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "id", "service");
    			attr_dev(input, "placeholder", input_placeholder_value = /*input*/ ctx[15].placeholder);
    			add_location(input, file$5, 176, 14, 5158);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*input*/ ctx[15].text);
    			dispose = listen_dev(input, "input", input_input_handler);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*formController*/ 1 && input_required_value !== (input_required_value = /*input*/ ctx[15].required)) {
    				prop_dev(input, "required", input_required_value);
    			}

    			if (dirty & /*formController*/ 1 && input_disabled_value !== (input_disabled_value = /*input*/ ctx[15].disabled)) {
    				prop_dev(input, "disabled", input_disabled_value);
    			}

    			if (dirty & /*formController*/ 1 && input_placeholder_value !== (input_placeholder_value = /*input*/ ctx[15].placeholder)) {
    				attr_dev(input, "placeholder", input_placeholder_value);
    			}

    			if (dirty & /*formController*/ 1 && input.value !== /*input*/ ctx[15].text) {
    				set_input_value(input, /*input*/ ctx[15].text);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(176:19) {#if input.type == \\\"text\\\"}",
    		ctx
    	});

    	return block;
    }

    // (206:7) {#each input.option as option}
    function create_each_block_2$1(ctx) {
    	let br;
    	let t0;
    	let label;
    	let input;
    	let input_value_value;
    	let t1;
    	let t2_value = /*option*/ ctx[18].label + "";
    	let t2;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[13].call(input, /*input*/ ctx[15]);
    	}

    	const block = {
    		c: function create() {
    			br = element("br");
    			t0 = space();
    			label = element("label");
    			input = element("input");
    			t1 = space();
    			t2 = text(t2_value);
    			add_location(br, file$5, 206, 8, 6949);
    			attr_dev(input, "type", "radio");
    			input.__value = input_value_value = /*option*/ ctx[18].value;
    			input.value = input.__value;
    			/*$$binding_groups*/ ctx[14][0].push(input);
    			add_location(input, file$5, 208, 9, 6982);
    			add_location(label, file$5, 207, 8, 6964);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			input.checked = input.__value === /*input*/ ctx[15].text;
    			append_dev(label, t1);
    			append_dev(label, t2);
    			dispose = listen_dev(input, "change", input_change_handler);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*formController*/ 1 && input_value_value !== (input_value_value = /*option*/ ctx[18].value)) {
    				prop_dev(input, "__value", input_value_value);
    			}

    			input.value = input.__value;

    			if (dirty & /*formController*/ 1) {
    				input.checked = input.__value === /*input*/ ctx[15].text;
    			}

    			if (dirty & /*formController*/ 1 && t2_value !== (t2_value = /*option*/ ctx[18].label + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(label);
    			/*$$binding_groups*/ ctx[14][0].splice(/*$$binding_groups*/ ctx[14][0].indexOf(input), 1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(206:7) {#each input.option as option}",
    		ctx
    	});

    	return block;
    }

    // (199:25) {#each input.option as option}
    function create_each_block_1$2(ctx) {
    	let option;
    	let t_value = /*option*/ ctx[18] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*option*/ ctx[18];
    			option.value = option.__value;
    			add_location(option, file$5, 199, 25, 6720);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*formController*/ 1 && t_value !== (t_value = /*option*/ ctx[18] + "")) set_data_dev(t, t_value);

    			if (dirty & /*formController*/ 1 && option_value_value !== (option_value_value = /*option*/ ctx[18])) {
    				prop_dev(option, "__value", option_value_value);
    			}

    			option.value = option.__value;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(199:25) {#each input.option as option}",
    		ctx
    	});

    	return block;
    }

    // (165:19) {#each formController.forms as input}
    function create_each_block$2(ctx) {
    	let div;
    	let label;
    	let t0_value = /*input*/ ctx[15].label + "";
    	let t0;
    	let t1;
    	let t2;
    	let if_block0 = /*input*/ ctx[15].required == true && create_if_block_9$1(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*input*/ ctx[15].type == "text") return create_if_block_2$2;
    		if (/*input*/ ctx[15].type == "textarea") return create_if_block_3$2;
    		if (/*input*/ ctx[15].type == "number") return create_if_block_4$2;
    		if (/*input*/ ctx[15].type == "date") return create_if_block_5$1;
    		if (/*input*/ ctx[15].type == "currency") return create_if_block_6$1;
    		if (/*input*/ ctx[15].type == "select_box") return create_if_block_7$1;
    		if (/*input*/ ctx[15].type == "radio") return create_if_block_8$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(label, "for", "service important-form");
    			add_location(label, file$5, 167, 20, 4776);
    			attr_dev(div, "class", "form-group col-md-12 ml-1 mr-1");
    			add_location(div, file$5, 166, 19, 4710);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(label, t0);
    			append_dev(label, t1);
    			if (if_block0) if_block0.m(label, null);
    			append_dev(div, t2);
    			if (if_block1) if_block1.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*formController*/ 1 && t0_value !== (t0_value = /*input*/ ctx[15].label + "")) set_data_dev(t0, t0_value);

    			if (/*input*/ ctx[15].required == true) {
    				if (!if_block0) {
    					if_block0 = create_if_block_9$1(ctx);
    					if_block0.c();
    					if_block0.m(label, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if (if_block1) if_block1.d(1);
    				if_block1 = current_block_type && current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();

    			if (if_block1) {
    				if_block1.d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(165:19) {#each formController.forms as input}",
    		ctx
    	});

    	return block;
    }

    // (223:49) 
    function create_if_block_1$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("SIMPAN");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(223:49) ",
    		ctx
    	});

    	return block;
    }

    // (221:22) {#if spinner == true}
    function create_if_block$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading..");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(221:22) {#if spinner == true}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div11;
    	let section0;
    	let div3;
    	let div2;
    	let div0;
    	let h1;
    	let t0;
    	let div1;
    	let ol;
    	let t1;
    	let li;
    	let t2_value = /*formController*/ ctx[0].header.title + "";
    	let t2;
    	let t3;
    	let section1;
    	let div10;
    	let div9;
    	let div8;
    	let div7;
    	let div5;
    	let h5;
    	let i;
    	let i_class_value;
    	let t4_value = /*formController*/ ctx[0].header.title + "";
    	let t4;
    	let t5;
    	let div4;
    	let t6;
    	let form;
    	let t7;
    	let div6;
    	let button;
    	let current;
    	let dispose;
    	let each_value_3 = /*formController*/ ctx[0].breadcrumb;
    	validate_each_argument(each_value_3);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_1[i] = create_each_block_3$1(get_each_context_3$1(ctx, each_value_3, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	const link = new Link({
    			props: {
    				to: /*formController*/ ctx[0].breadcrumb[/*formController*/ ctx[0].breadcrumb.length - 1].link,
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let each_value = /*formController*/ ctx[0].forms;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	function select_block_type_1(ctx, dirty) {
    		if (/*spinner*/ ctx[1] == true) return create_if_block$3;
    		if (/*spinner*/ ctx[1] == false) return create_if_block_1$3;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div11 = element("div");
    			section0 = element("section");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = space();
    			div1 = element("div");
    			ol = element("ol");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t1 = space();
    			li = element("li");
    			t2 = text(t2_value);
    			t3 = space();
    			section1 = element("section");
    			div10 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div5 = element("div");
    			h5 = element("h5");
    			i = element("i");
    			t4 = text(t4_value);
    			t5 = space();
    			div4 = element("div");
    			create_component(link.$$.fragment);
    			t6 = space();
    			form = element("form");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t7 = space();
    			div6 = element("div");
    			button = element("button");
    			if (if_block) if_block.c();
    			add_location(h1, file$5, 134, 11, 3388);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$5, 133, 9, 3353);
    			attr_dev(li, "class", "breadcrumb-item active");
    			add_location(li, file$5, 141, 13, 3684);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$5, 137, 11, 3460);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$5, 136, 9, 3425);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$5, 132, 7, 3320);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$5, 131, 5, 3282);
    			attr_dev(section0, "class", "content-header");
    			add_location(section0, file$5, 130, 1, 3243);
    			attr_dev(i, "class", i_class_value = "" + (/*formController*/ ctx[0].header.icon + " mr-2"));
    			add_location(i, file$5, 157, 40, 4185);
    			attr_dev(h5, "class", "mt-1 mb-0");
    			add_location(h5, file$5, 157, 18, 4163);
    			set_style(div4, "position", "absolute");
    			set_style(div4, "right", "20px");
    			set_style(div4, "top", "18px");
    			add_location(div4, file$5, 158, 18, 4288);
    			attr_dev(div5, "class", "card-header mb-2");
    			add_location(div5, file$5, 156, 15, 4113);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$5, 219, 21, 7260);
    			attr_dev(div6, "class", "card-footer");
    			add_location(div6, file$5, 218, 19, 7212);
    			attr_dev(form, "class", "mt-3");
    			add_location(form, file$5, 162, 17, 4550);
    			attr_dev(div7, "class", "card card-primary card-outline");
    			add_location(div7, file$5, 154, 13, 4050);
    			attr_dev(div8, "class", "col-md-12");
    			add_location(div8, file$5, 152, 10, 3968);
    			attr_dev(div9, "class", "row");
    			add_location(div9, file$5, 150, 8, 3907);
    			attr_dev(div10, "class", "container-fluid");
    			add_location(div10, file$5, 149, 5, 3868);
    			attr_dev(section1, "class", "content");
    			add_location(section1, file$5, 148, 1, 3836);
    			attr_dev(div11, "class", "container");
    			add_location(div11, file$5, 127, 0, 3197);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div11, anchor);
    			append_dev(div11, section0);
    			append_dev(section0, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, ol);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ol, null);
    			}

    			append_dev(ol, t1);
    			append_dev(ol, li);
    			append_dev(li, t2);
    			append_dev(div11, t3);
    			append_dev(div11, section1);
    			append_dev(section1, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div5);
    			append_dev(div5, h5);
    			append_dev(h5, i);
    			append_dev(h5, t4);
    			append_dev(div5, t5);
    			append_dev(div5, div4);
    			mount_component(link, div4, null);
    			append_dev(div7, t6);
    			append_dev(div7, form);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(form, null);
    			}

    			append_dev(form, t7);
    			append_dev(form, div6);
    			append_dev(div6, button);
    			if (if_block) if_block.m(button, null);
    			current = true;
    			dispose = listen_dev(form, "submit", prevent_default(/*post_request*/ ctx[2]), false, true, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*formController*/ 1) {
    				each_value_3 = /*formController*/ ctx[0].breadcrumb;
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3$1(ctx, each_value_3, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_3$1(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(ol, t1);
    					}
    				}

    				group_outros();

    				for (i = each_value_3.length; i < each_blocks_1.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if ((!current || dirty & /*formController*/ 1) && t2_value !== (t2_value = /*formController*/ ctx[0].header.title + "")) set_data_dev(t2, t2_value);

    			if (!current || dirty & /*formController*/ 1 && i_class_value !== (i_class_value = "" + (/*formController*/ ctx[0].header.icon + " mr-2"))) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if ((!current || dirty & /*formController*/ 1) && t4_value !== (t4_value = /*formController*/ ctx[0].header.title + "")) set_data_dev(t4, t4_value);
    			const link_changes = {};
    			if (dirty & /*formController*/ 1) link_changes.to = /*formController*/ ctx[0].breadcrumb[/*formController*/ ctx[0].breadcrumb.length - 1].link;

    			if (dirty & /*$$scope*/ 67108864) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);

    			if (dirty & /*formController, formatRupiah*/ 1) {
    				each_value = /*formController*/ ctx[0].forms;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(form, t7);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_3.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			transition_in(link.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			transition_out(link.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div11);
    			destroy_each(each_blocks_1, detaching);
    			destroy_component(link);
    			destroy_each(each_blocks, detaching);

    			if (if_block) {
    				if_block.d();
    			}

    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function formatRupiah$1(angka, prefix) {
    	if (angka != undefined) {
    		angka = angka.toString();
    		var number_string = angka.replace(/[^,\d]/g, "").toString();
    		var split = number_string.split(",");
    		var sisa = split[0].length % 3;
    		var rupiah = split[0].substr(0, sisa);
    		var ribuan = split[0].substr(sisa).match(/\d{3}/gi);
    		var separator;

    		// tambahkan titik jika yang di input sudah menjadi angka ribuan
    		if (ribuan) {
    			separator = sisa ? "." : "";
    			rupiah += separator + ribuan.join(".");
    		}

    		rupiah = split[1] != undefined ? rupiah + "," + split[1] : rupiah;

    		return prefix == undefined
    		? rupiah
    		: rupiah ? "Rp. " + rupiah : "";
    	}

    	return "Rp. 0";
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { formController } = $$props;
    	let data_id = null;

    	// loading screen
    	let spinner = false;

    	onMount(async => {
    		if (formController.mode == "edit") {
    			fetch(formController.api.apiRawData, { method: "GET" }).then(res => res.json()).then(data => {
    				let i = 0;
    				console.log(data);

    				if (data.length > 0) {
    					data_id = data[0][0].data;

    					for (i; i < formController.forms.length; i++) {
    						$$invalidate(0, formController.forms[i].text = data[0][i + 1].data, formController);
    					}
    				}

    				console.log(data);
    			});
    		}
    	});

    	function post_request() {
    		let validation = 0;
    		let temporary_get_gate = "?";

    		for (let i = 0; i < formController.forms.length; i++) {
    			if (formController.forms[i].required == true) {
    				if (formController.forms[i].text == "" || formController.forms[i].text == undefined || formController.forms[i].text == "undefined" || formController.forms[i].text == "-PILIH-") {
    					validation = 0;
    					alert("Anda harus melengkapi semua form yang bertanda *");
    					break;
    				} else {
    					validation = 1;
    				}
    			} else {
    				validation = 1;
    			}

    			if (validation == 1) {
    				temporary_get_gate = temporary_get_gate + "data_" + i + "=" + formController.forms[i].text + "&";
    			}
    		}

    		if (validation == 1) {
    			let confirm_changes = confirm("Anda yakin akan menyimpan perubahan ini?");

    			if (confirm_changes == true) {
    				let api_url = formController.api.apiUrl + temporary_get_gate + "data_id=" + data_id;
    				httpRequest(api_url);
    			}
    		}
    	}

    	function httpRequest(api) {
    		$$invalidate(1, spinner = true);

    		fetch(api, { method: "GET" }).then(res => res.json()).then(data => {
    			let data_raw = data;
    			console.log(data_raw);
    			alert("Perubahan data berhasil disimpan");
    			$$invalidate(1, spinner = false);
    			window.history.back();
    		}).catch(err => {
    			console.log(err);
    			alert("Gagal menyimpan data ke basis data\n- Cek koneksi internet anda\n- Coba dalam beberapa saat lagi");
    			$$invalidate(1, spinner = false);
    		});
    	}

    	let formattedSelected;
    	let dateChosen;
    	const writable_props = ["formController"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<InputEditForm> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("InputEditForm", $$slots, []);
    	const $$binding_groups = [[]];

    	function input_input_handler(input) {
    		input.text = this.value;
    		$$invalidate(0, formController);
    	}

    	function textarea_input_handler(input) {
    		input.text = this.value;
    		$$invalidate(0, formController);
    	}

    	function input_input_handler_1(input) {
    		input.text = to_number(this.value);
    		$$invalidate(0, formController);
    	}

    	function input_input_handler_2(input) {
    		input.text = this.value;
    		$$invalidate(0, formController);
    	}

    	function input0_input_handler(input) {
    		input.text = to_number(this.value);
    		$$invalidate(0, formController);
    	}

    	function select_change_handler(input) {
    		input.text = select_value(this);
    		$$invalidate(0, formController);
    	}

    	function input_change_handler(input) {
    		input.text = this.__value;
    		$$invalidate(0, formController);
    	}

    	$$self.$set = $$props => {
    		if ("formController" in $$props) $$invalidate(0, formController = $$props.formController);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Link,
    		formController,
    		data_id,
    		spinner,
    		post_request,
    		formatRupiah: formatRupiah$1,
    		httpRequest,
    		formattedSelected,
    		dateChosen
    	});

    	$$self.$inject_state = $$props => {
    		if ("formController" in $$props) $$invalidate(0, formController = $$props.formController);
    		if ("data_id" in $$props) data_id = $$props.data_id;
    		if ("spinner" in $$props) $$invalidate(1, spinner = $$props.spinner);
    		if ("formattedSelected" in $$props) formattedSelected = $$props.formattedSelected;
    		if ("dateChosen" in $$props) dateChosen = $$props.dateChosen;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*formController*/ 1) ;
    	};

    	return [
    		formController,
    		spinner,
    		post_request,
    		data_id,
    		httpRequest,
    		formattedSelected,
    		dateChosen,
    		input_input_handler,
    		textarea_input_handler,
    		input_input_handler_1,
    		input_input_handler_2,
    		input0_input_handler,
    		select_change_handler,
    		input_change_handler,
    		$$binding_groups
    	];
    }

    class InputEditForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { formController: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InputEditForm",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*formController*/ ctx[0] === undefined && !("formController" in props)) {
    			console_1$1.warn("<InputEditForm> was created without expected prop 'formController'");
    		}
    	}

    	get formController() {
    		throw new Error("<InputEditForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set formController(value) {
    		throw new Error("<InputEditForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\TambahStaf.svelte generated by Svelte v3.19.2 */

    function create_fragment$8(ctx) {
    	let current;

    	const inputeditform = new InputEditForm({
    			props: {
    				formController: /*formController*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(inputeditform.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(inputeditform, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const inputeditform_changes = {};
    			if (dirty & /*formController*/ 1) inputeditform_changes.formController = /*formController*/ ctx[0];
    			inputeditform.$set(inputeditform_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inputeditform.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inputeditform.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(inputeditform, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let apiBaseUrl = "http://127.0.0.1/lumeraAPI";
    	let { id } = $$props;

    	let formController = {
    		mode: "edit", //atau edit
    		header: {
    			title: "Tambah Staff",
    			icon: "fas fa-plus-square"
    		},
    		breadcrumb: [{ link: "dashboard", value: "Dashboard" }, { link: "staf", value: "Staf" }],
    		api: {
    			apiUrl: apiBaseUrl + "/master_data/insertEditStaff.php",
    			apiRawData: apiBaseUrl + "/master_data/getAllStaff.php?id=" + id
    		},
    		forms: [
    			{
    				label: "Nama Staf",
    				required: true,
    				text: "",
    				placeholder: "Masukan Nama Staf",
    				type: "text"
    			},
    			{
    				label: "Username",
    				required: true,
    				text: "",
    				placeholder: "Masukan Username",
    				type: "text"
    			},
    			{
    				label: "Password",
    				required: true,
    				text: "",
    				placeholder: "Masukan Password",
    				type: "text"
    			},
    			{
    				label: "Posisi",
    				required: true,
    				text: "",
    				type: "select_box",
    				option: ["Administrator", "Kasir", "Clinician", "Stylist", "Hair Washer"]
    			},
    			{
    				label: "Status",
    				required: true,
    				text: "1",
    				type: "radio",
    				option: [{ label: "Aktif", value: "1" }, { label: "Tidak Aktif", value: "0" }]
    			}
    		]
    	};

    	if (id = undefined) {
    		formController.mode = "insert";
    	} else {
    		formController.mode = "edit";
    	}

    	const writable_props = ["id"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TambahStaf> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TambahStaf", $$slots, []);

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({
    		apiBaseUrl,
    		id,
    		Router,
    		Link,
    		Route,
    		InputEditForm,
    		formController
    	});

    	$$self.$inject_state = $$props => {
    		if ("apiBaseUrl" in $$props) apiBaseUrl = $$props.apiBaseUrl;
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("formController" in $$props) $$invalidate(0, formController = $$props.formController);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [formController, id];
    }

    class TambahStaf extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { id: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TambahStaf",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[1] === undefined && !("id" in props)) {
    			console.warn("<TambahStaf> was created without expected prop 'id'");
    		}
    	}

    	get id() {
    		throw new Error("<TambahStaf>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<TambahStaf>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\Produkkecantikan.svelte generated by Svelte v3.19.2 */
    const file$6 = "src\\Pages\\Produkkecantikan.svelte";

    // (50:40) <Link to = "dashboard">
    function create_default_slot$4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Dashboard");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(50:40) <Link to = \\\"dashboard\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div4;
    	let section;
    	let div3;
    	let div2;
    	let div0;
    	let h1;
    	let t0;
    	let div1;
    	let ol;
    	let li0;
    	let t1;
    	let li1;
    	let t3;
    	let current;

    	const link = new Link({
    			props: {
    				to: "dashboard",
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tableviewer = new TableViewer({
    			props: { controller: /*controller*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			section = element("section");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = space();
    			div1 = element("div");
    			ol = element("ol");
    			li0 = element("li");
    			create_component(link.$$.fragment);
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "Produk Kecantikan";
    			t3 = space();
    			create_component(tableviewer.$$.fragment);
    			add_location(h1, file$6, 45, 10, 1254);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$6, 44, 8, 1220);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$6, 49, 12, 1375);
    			attr_dev(li1, "class", "breadcrumb-item active");
    			add_location(li1, file$6, 50, 12, 1461);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$6, 48, 10, 1323);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$6, 47, 8, 1289);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$6, 43, 6, 1188);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$6, 42, 4, 1151);
    			attr_dev(section, "class", "content-header");
    			add_location(section, file$6, 41, 2, 1113);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$6, 39, 0, 1045);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, section);
    			append_dev(section, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, ol);
    			append_dev(ol, li0);
    			mount_component(link, li0, null);
    			append_dev(ol, t1);
    			append_dev(ol, li1);
    			append_dev(div4, t3);
    			mount_component(tableviewer, div4, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			transition_in(tableviewer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			transition_out(tableviewer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(link);
    			destroy_component(tableviewer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { apiBaseUrl = "http://127.0.0.1/lumeraAPI" } = $$props;

    	let controller = {
    		name: "produkkecantikan",
    		title: "Daftar Produk Kecantikan",
    		sub_title: "Kelola produk kecantikan disini",
    		icon: "fas fa-spa",
    		search_selector: 1,
    		button: {
    			text: "Tambah Produk Kecantikan",
    			icon: "fa fa-plus",
    			link: "tambah"
    		},
    		table_header: ["#", "Nama Produk", "Harga", "Stok", "Status", "Aksi"],
    		apiUrl: apiBaseUrl + "/master_data/getAllProduct.php"
    	};

    	const writable_props = ["apiBaseUrl"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Produkkecantikan> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Produkkecantikan", $$slots, []);

    	$$self.$set = $$props => {
    		if ("apiBaseUrl" in $$props) $$invalidate(1, apiBaseUrl = $$props.apiBaseUrl);
    	};

    	$$self.$capture_state = () => ({
    		apiBaseUrl,
    		Router,
    		Link,
    		Route,
    		onMount,
    		TableViewer,
    		controller
    	});

    	$$self.$inject_state = $$props => {
    		if ("apiBaseUrl" in $$props) $$invalidate(1, apiBaseUrl = $$props.apiBaseUrl);
    		if ("controller" in $$props) $$invalidate(0, controller = $$props.controller);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [controller, apiBaseUrl];
    }

    class Produkkecantikan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { apiBaseUrl: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Produkkecantikan",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get apiBaseUrl() {
    		throw new Error("<Produkkecantikan>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set apiBaseUrl(value) {
    		throw new Error("<Produkkecantikan>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\TambahProdukkecantikan.svelte generated by Svelte v3.19.2 */

    function create_fragment$a(ctx) {
    	let current;

    	const inputeditform = new InputEditForm({
    			props: {
    				formController: /*formController*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(inputeditform.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(inputeditform, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const inputeditform_changes = {};
    			if (dirty & /*formController*/ 1) inputeditform_changes.formController = /*formController*/ ctx[0];
    			inputeditform.$set(inputeditform_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inputeditform.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inputeditform.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(inputeditform, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let apiBaseUrl = "http://127.0.0.1/lumeraAPI";
    	let { id } = $$props;

    	let formController = {
    		mode: "edit", //atau edit
    		header: {
    			title: "Tambah Produk Kecantikan",
    			icon: "fas fa-plus-square"
    		},
    		breadcrumb: [
    			{ link: "dashboard", value: "Dashboard" },
    			{
    				link: "produkkecantikan",
    				value: "Produk Kecantikan"
    			}
    		],
    		api: {
    			apiUrl: apiBaseUrl + "/master_data/insertEditProduct.php",
    			apiRawData: apiBaseUrl + "/master_data/getAllProduct.php?id=" + id
    		},
    		forms: [
    			{
    				label: "Nama Produk",
    				required: true,
    				text: "",
    				placeholder: "Masukan Nama Produk",
    				type: "text"
    			},
    			{
    				label: "Harga",
    				required: true,
    				text: "",
    				placeholder: "Masukan Harga",
    				type: "currency"
    			},
    			{
    				label: "Stok",
    				required: false,
    				text: "0",
    				type: "text",
    				disabled: true
    			},
    			{
    				label: "Status",
    				required: true,
    				text: "1",
    				type: "radio",
    				option: [{ label: "Aktif", value: "1" }, { label: "Tidak Aktif", value: "0" }]
    			}
    		]
    	};

    	if (id = undefined) {
    		formController.mode = "insert";
    	} else {
    		formController.mode = "edit";
    	}

    	const writable_props = ["id"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TambahProdukkecantikan> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TambahProdukkecantikan", $$slots, []);

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({
    		apiBaseUrl,
    		id,
    		Router,
    		Link,
    		Route,
    		InputEditForm,
    		formController
    	});

    	$$self.$inject_state = $$props => {
    		if ("apiBaseUrl" in $$props) apiBaseUrl = $$props.apiBaseUrl;
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("formController" in $$props) $$invalidate(0, formController = $$props.formController);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [formController, id];
    }

    class TambahProdukkecantikan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { id: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TambahProdukkecantikan",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[1] === undefined && !("id" in props)) {
    			console.warn("<TambahProdukkecantikan> was created without expected prop 'id'");
    		}
    	}

    	get id() {
    		throw new Error("<TambahProdukkecantikan>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<TambahProdukkecantikan>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\Layanan.svelte generated by Svelte v3.19.2 */
    const file$7 = "src\\Pages\\Layanan.svelte";

    // (49:40) <Link to = "dashboard">
    function create_default_slot$5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Dashboard");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(49:40) <Link to = \\\"dashboard\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div4;
    	let section;
    	let div3;
    	let div2;
    	let div0;
    	let h1;
    	let t0;
    	let div1;
    	let ol;
    	let li0;
    	let t1;
    	let li1;
    	let t3;
    	let current;

    	const link = new Link({
    			props: {
    				to: "dashboard",
    				$$slots: { default: [create_default_slot$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tableviewer = new TableViewer({
    			props: { controller: /*controller*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			section = element("section");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = space();
    			div1 = element("div");
    			ol = element("ol");
    			li0 = element("li");
    			create_component(link.$$.fragment);
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "Layanan";
    			t3 = space();
    			create_component(tableviewer.$$.fragment);
    			add_location(h1, file$7, 44, 10, 1205);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$7, 43, 8, 1171);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$7, 48, 12, 1326);
    			attr_dev(li1, "class", "breadcrumb-item active");
    			add_location(li1, file$7, 49, 12, 1412);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$7, 47, 10, 1274);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$7, 46, 8, 1240);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$7, 42, 6, 1139);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$7, 41, 4, 1102);
    			attr_dev(section, "class", "content-header");
    			add_location(section, file$7, 40, 2, 1064);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$7, 38, 0, 996);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, section);
    			append_dev(section, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, ol);
    			append_dev(ol, li0);
    			mount_component(link, li0, null);
    			append_dev(ol, t1);
    			append_dev(ol, li1);
    			append_dev(div4, t3);
    			mount_component(tableviewer, div4, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			transition_in(tableviewer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			transition_out(tableviewer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(link);
    			destroy_component(tableviewer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { apiBaseUrl = "http://127.0.0.1/lumeraAPI" } = $$props;

    	let controller = {
    		name: "layanan",
    		title: "Daftar Layanan",
    		sub_title: "Kelola layanan disini",
    		icon: "fa fa-handshake",
    		search_selector: 1,
    		button: {
    			text: "Tambah Layanan",
    			icon: "fa fa-plus",
    			link: "tambah"
    		},
    		table_header: ["#", "Nama Layanan", "Harga", "Kategori", "Status", "Aksi"],
    		apiUrl: apiBaseUrl + "/master_data/getAllServices.php"
    	};

    	const writable_props = ["apiBaseUrl"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Layanan> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Layanan", $$slots, []);

    	$$self.$set = $$props => {
    		if ("apiBaseUrl" in $$props) $$invalidate(1, apiBaseUrl = $$props.apiBaseUrl);
    	};

    	$$self.$capture_state = () => ({
    		apiBaseUrl,
    		Router,
    		Link,
    		Route,
    		onMount,
    		TableViewer,
    		controller
    	});

    	$$self.$inject_state = $$props => {
    		if ("apiBaseUrl" in $$props) $$invalidate(1, apiBaseUrl = $$props.apiBaseUrl);
    		if ("controller" in $$props) $$invalidate(0, controller = $$props.controller);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [controller, apiBaseUrl];
    }

    class Layanan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { apiBaseUrl: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Layanan",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get apiBaseUrl() {
    		throw new Error("<Layanan>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set apiBaseUrl(value) {
    		throw new Error("<Layanan>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\TambahLayanan.svelte generated by Svelte v3.19.2 */

    function create_fragment$c(ctx) {
    	let current;

    	const inputeditform = new InputEditForm({
    			props: {
    				formController: /*formController*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(inputeditform.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(inputeditform, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const inputeditform_changes = {};
    			if (dirty & /*formController*/ 1) inputeditform_changes.formController = /*formController*/ ctx[0];
    			inputeditform.$set(inputeditform_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inputeditform.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inputeditform.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(inputeditform, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let apiBaseUrl = "http://127.0.0.1/lumeraAPI";
    	let { id } = $$props;

    	let formController = {
    		mode: "edit", //atau edit
    		header: {
    			title: "Tambah Layanan",
    			icon: "fas fa-plus-square"
    		},
    		breadcrumb: [
    			{ link: "dashboard", value: "dashboard" },
    			{ link: "layanan", value: "layanan" }
    		],
    		api: {
    			apiUrl: apiBaseUrl + "/master_data/insertEditServices.php",
    			apiRawData: apiBaseUrl + "/master_data/getAllServices.php?id=" + id
    		},
    		forms: [
    			{
    				label: "Nama Layanan",
    				required: true,
    				text: "",
    				placeholder: "Masukan Nama Layanan",
    				type: "text"
    			},
    			{
    				label: "Harga",
    				required: true,
    				text: "",
    				placeholder: "Masukan Harga",
    				type: "currency"
    			},
    			{
    				label: "Kategori",
    				required: true,
    				text: "",
    				type: "select_box",
    				option: ["Klinik", "Salon"]
    			},
    			{
    				label: "Status",
    				required: true,
    				text: "1",
    				type: "radio",
    				option: [{ label: "Aktif", value: "1" }, { label: "Tidak Aktif", value: "0" }]
    			}
    		]
    	};

    	if (id = undefined) {
    		formController.mode = "insert";
    	} else {
    		formController.mode = "edit";
    	}

    	const writable_props = ["id"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TambahLayanan> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TambahLayanan", $$slots, []);

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({
    		apiBaseUrl,
    		id,
    		Router,
    		Link,
    		Route,
    		InputEditForm,
    		formController
    	});

    	$$self.$inject_state = $$props => {
    		if ("apiBaseUrl" in $$props) apiBaseUrl = $$props.apiBaseUrl;
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("formController" in $$props) $$invalidate(0, formController = $$props.formController);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [formController, id];
    }

    class TambahLayanan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { id: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TambahLayanan",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[1] === undefined && !("id" in props)) {
    			console.warn("<TambahLayanan> was created without expected prop 'id'");
    		}
    	}

    	get id() {
    		throw new Error("<TambahLayanan>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<TambahLayanan>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\Pasien.svelte generated by Svelte v3.19.2 */
    const file$8 = "src\\Pages\\Pasien.svelte";

    // (49:40) <Link to = "dashboard">
    function create_default_slot$6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Dashboard");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(49:40) <Link to = \\\"dashboard\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div4;
    	let section;
    	let div3;
    	let div2;
    	let div0;
    	let h1;
    	let t0;
    	let div1;
    	let ol;
    	let li0;
    	let t1;
    	let li1;
    	let t3;
    	let current;

    	const link = new Link({
    			props: {
    				to: "dashboard",
    				$$slots: { default: [create_default_slot$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tableviewer = new TableViewer({
    			props: { controller: /*controller*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			section = element("section");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = space();
    			div1 = element("div");
    			ol = element("ol");
    			li0 = element("li");
    			create_component(link.$$.fragment);
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "Pasien";
    			t3 = space();
    			create_component(tableviewer.$$.fragment);
    			add_location(h1, file$8, 44, 10, 1219);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$8, 43, 8, 1185);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$8, 48, 12, 1340);
    			attr_dev(li1, "class", "breadcrumb-item active");
    			add_location(li1, file$8, 49, 12, 1426);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$8, 47, 10, 1288);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$8, 46, 8, 1254);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$8, 42, 6, 1153);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$8, 41, 4, 1116);
    			attr_dev(section, "class", "content-header");
    			add_location(section, file$8, 40, 2, 1078);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$8, 38, 0, 1010);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, section);
    			append_dev(section, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, ol);
    			append_dev(ol, li0);
    			mount_component(link, li0, null);
    			append_dev(ol, t1);
    			append_dev(ol, li1);
    			append_dev(div4, t3);
    			mount_component(tableviewer, div4, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			transition_in(tableviewer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			transition_out(tableviewer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(link);
    			destroy_component(tableviewer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { apiBaseUrl = "http://127.0.0.1/lumeraAPI" } = $$props;

    	let controller = {
    		name: "pasien",
    		title: "Daftar Pasien",
    		sub_title: "Kelola pasien disini",
    		icon: "fa fa-address-book",
    		search_selector: 1,
    		button: {
    			text: "Tambah Pasien",
    			icon: "fa fa-plus",
    			link: "tambah"
    		},
    		table_header: ["#", "Nama Pasien", "Alamat", "No. HP", "Tanggal Lahir", "Status", "Aksi"],
    		apiUrl: apiBaseUrl + "/master_data/getAllPatients.php"
    	};

    	const writable_props = ["apiBaseUrl"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Pasien> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Pasien", $$slots, []);

    	$$self.$set = $$props => {
    		if ("apiBaseUrl" in $$props) $$invalidate(1, apiBaseUrl = $$props.apiBaseUrl);
    	};

    	$$self.$capture_state = () => ({
    		apiBaseUrl,
    		Router,
    		Link,
    		Route,
    		onMount,
    		TableViewer,
    		controller
    	});

    	$$self.$inject_state = $$props => {
    		if ("apiBaseUrl" in $$props) $$invalidate(1, apiBaseUrl = $$props.apiBaseUrl);
    		if ("controller" in $$props) $$invalidate(0, controller = $$props.controller);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [controller, apiBaseUrl];
    }

    class Pasien extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { apiBaseUrl: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pasien",
    			options,
    			id: create_fragment$d.name
    		});
    	}

    	get apiBaseUrl() {
    		throw new Error("<Pasien>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set apiBaseUrl(value) {
    		throw new Error("<Pasien>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\TambahPasien.svelte generated by Svelte v3.19.2 */

    function create_fragment$e(ctx) {
    	let current;

    	const inputeditform = new InputEditForm({
    			props: {
    				formController: /*formController*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(inputeditform.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(inputeditform, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const inputeditform_changes = {};
    			if (dirty & /*formController*/ 1) inputeditform_changes.formController = /*formController*/ ctx[0];
    			inputeditform.$set(inputeditform_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(inputeditform.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(inputeditform.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(inputeditform, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let apiBaseUrl = "http://127.0.0.1/lumeraAPI";
    	let { id } = $$props;

    	let formController = {
    		mode: "edit", //atau edit
    		header: {
    			title: "Tambah Pasien",
    			icon: "fas fa-plus-square"
    		},
    		breadcrumb: [
    			{ link: "dashboard", value: "Dashboard" },
    			{ link: "pasien", value: "Pasien" }
    		],
    		api: {
    			apiUrl: apiBaseUrl + "/master_data/insertEditPatients.php",
    			apiRawData: apiBaseUrl + "/master_data/getAllPatients.php?id=" + id
    		},
    		forms: [
    			{
    				label: "Nama Pasien",
    				required: true,
    				text: "",
    				placeholder: "Masukan Nama Pasien",
    				type: "text"
    			},
    			{
    				label: "Alamat",
    				required: true,
    				text: "",
    				placeholder: "Masukan Alamat",
    				type: "textarea"
    			},
    			{
    				label: "No. HP",
    				required: true,
    				text: "",
    				placeholder: "Masukan No. HP",
    				type: "number"
    			},
    			{
    				label: "Tanggal Lahir",
    				required: true,
    				text: "",
    				type: "date"
    			},
    			{
    				label: "Status",
    				required: true,
    				text: "1",
    				type: "radio",
    				option: [{ label: "Aktif", value: "1" }, { label: "Tidak Aktif", value: "0" }]
    			}
    		]
    	};

    	if (id = undefined) {
    		formController.mode = "insert";
    	} else {
    		formController.mode = "edit";
    	}

    	const writable_props = ["id"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TambahPasien> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TambahPasien", $$slots, []);

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({
    		apiBaseUrl,
    		id,
    		Router,
    		Link,
    		Route,
    		InputEditForm,
    		formController
    	});

    	$$self.$inject_state = $$props => {
    		if ("apiBaseUrl" in $$props) apiBaseUrl = $$props.apiBaseUrl;
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("formController" in $$props) $$invalidate(0, formController = $$props.formController);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [formController, id];
    }

    class TambahPasien extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { id: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TambahPasien",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[1] === undefined && !("id" in props)) {
    			console.warn("<TambahPasien> was created without expected prop 'id'");
    		}
    	}

    	get id() {
    		throw new Error("<TambahPasien>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<TambahPasien>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\Dashboard.svelte generated by Svelte v3.19.2 */

    function create_fragment$f(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Dashboard> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Dashboard", $$slots, []);
    	return [];
    }

    class Dashboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dashboard",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src\component\invoice.svelte generated by Svelte v3.19.2 */

    const { console: console_1$2 } = globals;
    const file$9 = "src\\component\\invoice.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	child_ctx[4] = i;
    	return child_ctx;
    }

    // (75:6) {#each items as invoice, i}
    function create_each_block$3(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*i*/ ctx[4] + 1 + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*invoice*/ ctx[2].product_name + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*invoice*/ ctx[2].product_qty + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = formatRupiah$2(/*invoice*/ ctx[2].product_price, "Rp.") + "";
    	let t6;
    	let t7;
    	let td4;
    	let t8_value = formatRupiah$2(/*invoice*/ ctx[2].product_price * /*invoice*/ ctx[2].product_qty, "Rp. ") + "";
    	let t8;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			t8 = text(t8_value);
    			add_location(td0, file$9, 76, 13, 1782);
    			add_location(td1, file$9, 77, 13, 1813);
    			add_location(td2, file$9, 78, 13, 1859);
    			add_location(td3, file$9, 79, 13, 1904);
    			add_location(td4, file$9, 80, 13, 1972);
    			add_location(tr, file$9, 75, 10, 1763);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td4);
    			append_dev(td4, t8);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 2 && t2_value !== (t2_value = /*invoice*/ ctx[2].product_name + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*items*/ 2 && t4_value !== (t4_value = /*invoice*/ ctx[2].product_qty + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*items*/ 2 && t6_value !== (t6_value = formatRupiah$2(/*invoice*/ ctx[2].product_price, "Rp.") + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*items*/ 2 && t8_value !== (t8_value = formatRupiah$2(/*invoice*/ ctx[2].product_price * /*invoice*/ ctx[2].product_qty, "Rp. ") + "")) set_data_dev(t8, t8_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(75:6) {#each items as invoice, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let div;
    	let h5;
    	let t1;
    	let p;
    	let t2;
    	let t3_value = /*invoice_data*/ ctx[0].purchase_date + "";
    	let t3;
    	let t4;
    	let table;
    	let thead;
    	let tr0;
    	let th0;
    	let t6;
    	let th1;
    	let t8;
    	let th2;
    	let t10;
    	let th3;
    	let t12;
    	let th4;
    	let t14;
    	let tbody;
    	let t15;
    	let tr1;
    	let td0;
    	let t17;
    	let td1;
    	let b;
    	let t18_value = formatRupiah$2(/*invoice_data*/ ctx[0].purchase_total, "Rp. ") + "";
    	let t18;
    	let each_value = /*items*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h5 = element("h5");
    			h5.textContent = "Invoice";
    			t1 = space();
    			p = element("p");
    			t2 = text("Tanggal Invoice : ");
    			t3 = text(t3_value);
    			t4 = space();
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "#";
    			t6 = space();
    			th1 = element("th");
    			th1.textContent = "Nama Produk";
    			t8 = space();
    			th2 = element("th");
    			th2.textContent = "Jumlah Produk";
    			t10 = space();
    			th3 = element("th");
    			th3.textContent = "Harga Satuan";
    			t12 = space();
    			th4 = element("th");
    			th4.textContent = "Total";
    			t14 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t15 = space();
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "Total Pembayaran";
    			t17 = space();
    			td1 = element("td");
    			b = element("b");
    			t18 = text(t18_value);
    			attr_dev(h5, "class", "title mb-3 mt-3");
    			add_location(h5, file$9, 60, 1, 1338);
    			add_location(p, file$9, 61, 1, 1381);
    			attr_dev(th0, "class", "text-center");
    			add_location(th0, file$9, 66, 13, 1504);
    			add_location(th1, file$9, 67, 13, 1549);
    			add_location(th2, file$9, 68, 13, 1584);
    			add_location(th3, file$9, 69, 13, 1621);
    			add_location(th4, file$9, 70, 13, 1657);
    			add_location(tr0, file$9, 65, 9, 1485);
    			add_location(thead, file$9, 64, 5, 1467);
    			attr_dev(td0, "colspan", "4");
    			set_style(td0, "text-align", "right");
    			add_location(td0, file$9, 84, 11, 2113);
    			add_location(b, file$9, 85, 27, 2206);
    			attr_dev(td1, "colspan", "2");
    			add_location(td1, file$9, 85, 11, 2190);
    			add_location(tr1, file$9, 83, 10, 2096);
    			add_location(tbody, file$9, 73, 5, 1709);
    			attr_dev(table, "class", "table");
    			add_location(table, file$9, 63, 1, 1439);
    			add_location(div, file$9, 58, 0, 1328);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h5);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(div, t4);
    			append_dev(div, table);
    			append_dev(table, thead);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t6);
    			append_dev(tr0, th1);
    			append_dev(tr0, t8);
    			append_dev(tr0, th2);
    			append_dev(tr0, t10);
    			append_dev(tr0, th3);
    			append_dev(tr0, t12);
    			append_dev(tr0, th4);
    			append_dev(table, t14);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			append_dev(tbody, t15);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t17);
    			append_dev(tr1, td1);
    			append_dev(td1, b);
    			append_dev(b, t18);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*invoice_data*/ 1 && t3_value !== (t3_value = /*invoice_data*/ ctx[0].purchase_date + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*formatRupiah, items*/ 2) {
    				each_value = /*items*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, t15);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*invoice_data*/ 1 && t18_value !== (t18_value = formatRupiah$2(/*invoice_data*/ ctx[0].purchase_total, "Rp. ") + "")) set_data_dev(t18, t18_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function formatRupiah$2(angka, prefix) {
    	if (angka != undefined) {
    		angka = angka.toString();
    		var number_string = angka.replace(/[^,\d]/g, "").toString();
    		var split = number_string.split(",");
    		var sisa = split[0].length % 3;
    		var rupiah = split[0].substr(0, sisa);
    		var ribuan = split[0].substr(sisa).match(/\d{3}/gi);
    		var separator;

    		// tambahkan titik jika yang di input sudah menjadi angka ribuan
    		if (ribuan) {
    			separator = sisa ? "." : "";
    			rupiah += separator + ribuan.join(".");
    		}

    		rupiah = split[1] != undefined ? rupiah + "," + split[1] : rupiah;

    		return prefix == undefined
    		? rupiah
    		: rupiah ? "Rp. " + rupiah : "";
    	}

    	return "Rp. 0";
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { invoice_data } = $$props;
    	let items = invoice_data.purchase_items;

    	onMount(async () => {
    		console.log(invoice_data);
    		$$invalidate(1, items = invoice_data.purchase_items);
    	});

    	const writable_props = ["invoice_data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Invoice> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Invoice", $$slots, []);

    	$$self.$set = $$props => {
    		if ("invoice_data" in $$props) $$invalidate(0, invoice_data = $$props.invoice_data);
    	};

    	$$self.$capture_state = () => ({
    		invoice_data,
    		onMount,
    		items,
    		formatRupiah: formatRupiah$2
    	});

    	$$self.$inject_state = $$props => {
    		if ("invoice_data" in $$props) $$invalidate(0, invoice_data = $$props.invoice_data);
    		if ("items" in $$props) $$invalidate(1, items = $$props.items);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [invoice_data, items];
    }

    class Invoice extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { invoice_data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Invoice",
    			options,
    			id: create_fragment$g.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*invoice_data*/ ctx[0] === undefined && !("invoice_data" in props)) {
    			console_1$2.warn("<Invoice> was created without expected prop 'invoice_data'");
    		}
    	}

    	get invoice_data() {
    		throw new Error("<Invoice>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set invoice_data(value) {
    		throw new Error("<Invoice>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\PembelianProdukKecantikan.svelte generated by Svelte v3.19.2 */

    const { console: console_1$3 } = globals;
    const file$a = "src\\Pages\\PembelianProdukKecantikan.svelte";

    function get_each_context_3$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[33] = list[i];
    	child_ctx[41] = list;
    	child_ctx[35] = i;
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[36] = list[i];
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[39] = list[i];
    	child_ctx[35] = i;
    	return child_ctx;
    }

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[33] = list[i];
    	child_ctx[34] = list;
    	child_ctx[35] = i;
    	return child_ctx;
    }

    function get_each_context_1$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[36] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[39] = list[i];
    	child_ctx[35] = i;
    	return child_ctx;
    }

    // (428:34) 
    function create_if_block_4$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_5$2, create_if_block_9$2];
    	const if_blocks = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*purchaseDetail*/ ctx[5].purchase_status == 0) return 0;
    		if (/*purchaseDetail*/ ctx[5].purchase_status == 1) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_2(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_2(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$3.name,
    		type: "if",
    		source: "(428:34) ",
    		ctx
    	});

    	return block;
    }

    // (342:1) {#if id == "pembelian-baru"}
    function create_if_block$4(ctx) {
    	let span0;
    	let t1;
    	let div20;
    	let div6;
    	let div5;
    	let div4;
    	let div0;
    	let h50;
    	let t3;
    	let p0;
    	let t5;
    	let div3;
    	let div2;
    	let input;
    	let t6;
    	let div1;
    	let span1;
    	let i;
    	let t7;
    	let t8;
    	let nav;
    	let ul;
    	let t9;
    	let div19;
    	let div7;
    	let h51;
    	let t11;
    	let current_block_type_index;
    	let if_block;
    	let t12;
    	let div18;
    	let div10;
    	let div8;
    	let p1;
    	let t14;
    	let div9;
    	let p2;
    	let t15_value = formatRupiah$3(/*bill*/ ctx[4].sub_total, "Rp. ") + "";
    	let t15;
    	let t16;
    	let div13;
    	let div11;
    	let p3;
    	let t18;
    	let div12;
    	let p4;
    	let t19_value = formatRupiah$3(/*bill*/ ctx[4].taxes, "Rp. ") + "";
    	let t19;
    	let t20;
    	let div16;
    	let div14;
    	let p5;
    	let t22;
    	let div15;
    	let p6;
    	let t23_value = formatRupiah$3(/*bill*/ ctx[4].total, "Rp. ") + "";
    	let t23;
    	let t24;
    	let hr;
    	let t25;
    	let div17;
    	let button0;
    	let t27;
    	let button1;
    	let t29;
    	let button2;
    	let current;
    	let dispose;
    	let each_value_2 = /*data_bind*/ ctx[2];
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2$2(get_each_context_2$2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*num_of_page*/ ctx[6];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$3(get_each_context_1$3(ctx, each_value_1, i));
    	}

    	const if_block_creators = [create_if_block_1$4, create_if_block_2$3];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*cart*/ ctx[1].length > 0) return 0;
    		if (/*cart*/ ctx[1].length == 0) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_1(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			span0.textContent = "PEMBELIAN BARU";
    			t1 = space();
    			div20 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			h50 = element("h5");
    			h50.textContent = "Daftar Pembelian Produk";
    			t3 = space();
    			p0 = element("p");
    			p0.textContent = "Lakukan pembelian produk disini";
    			t5 = space();
    			div3 = element("div");
    			div2 = element("div");
    			input = element("input");
    			t6 = space();
    			div1 = element("div");
    			span1 = element("span");
    			i = element("i");
    			t7 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t8 = space();
    			nav = element("nav");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t9 = space();
    			div19 = element("div");
    			div7 = element("div");
    			h51 = element("h5");
    			h51.textContent = "Checkout";
    			t11 = space();
    			if (if_block) if_block.c();
    			t12 = space();
    			div18 = element("div");
    			div10 = element("div");
    			div8 = element("div");
    			p1 = element("p");
    			p1.textContent = "Subtotal";
    			t14 = space();
    			div9 = element("div");
    			p2 = element("p");
    			t15 = text(t15_value);
    			t16 = space();
    			div13 = element("div");
    			div11 = element("div");
    			p3 = element("p");
    			p3.textContent = "Pajak";
    			t18 = space();
    			div12 = element("div");
    			p4 = element("p");
    			t19 = text(t19_value);
    			t20 = space();
    			div16 = element("div");
    			div14 = element("div");
    			p5 = element("p");
    			p5.textContent = "Total";
    			t22 = space();
    			div15 = element("div");
    			p6 = element("p");
    			t23 = text(t23_value);
    			t24 = space();
    			hr = element("hr");
    			t25 = space();
    			div17 = element("div");
    			button0 = element("button");
    			button0.textContent = "Checkout";
    			t27 = space();
    			button1 = element("button");
    			button1.textContent = "Simpan";
    			t29 = space();
    			button2 = element("button");
    			button2.textContent = "Batal";
    			attr_dev(span0, "class", "badge badge-pill badge-success");
    			add_location(span0, file$a, 342, 2, 7970);
    			attr_dev(h50, "class", "title mb-1 mt-1 svelte-1g115y4");
    			add_location(h50, file$a, 348, 8, 8211);
    			add_location(p0, file$a, 349, 8, 8277);
    			attr_dev(div0, "class", "col-lg-8 mb-3");
    			add_location(div0, file$a, 347, 7, 8174);
    			attr_dev(input, "class", "form-control svelte-1g115y4");
    			attr_dev(input, "placeholder", "Cari disini..");
    			attr_dev(input, "type", "text");
    			add_location(input, file$a, 353, 25, 8428);
    			set_style(i, "cursor", "pointer");
    			attr_dev(i, "class", "fa fa-search");
    			add_location(i, file$a, 355, 58, 8640);
    			attr_dev(span1, "class", "input-group-text");
    			add_location(span1, file$a, 355, 27, 8609);
    			attr_dev(div1, "class", "input-group-append");
    			add_location(div1, file$a, 354, 25, 8548);
    			attr_dev(div2, "class", "input-group mt-2");
    			add_location(div2, file$a, 352, 8, 8371);
    			attr_dev(div3, "class", "col-lg-4");
    			add_location(div3, file$a, 351, 7, 8339);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$a, 346, 6, 8148);
    			attr_dev(ul, "class", "pagination pagination-lg");
    			add_location(ul, file$a, 372, 12, 9473);
    			set_style(nav, "margin-top", "12px");
    			set_style(nav, "position", "absolute");
    			set_style(nav, "left", "20px");
    			set_style(nav, "bottom", "10px");
    			add_location(nav, file$a, 371, 6, 9389);
    			attr_dev(div5, "class", "product mt-1 svelte-1g115y4");
    			set_style(div5, "height", "640px");
    			add_location(div5, file$a, 345, 5, 8092);
    			attr_dev(div6, "class", "col-lg-8");
    			add_location(div6, file$a, 344, 4, 8063);
    			attr_dev(h51, "class", "title mb-3 svelte-1g115y4");
    			add_location(h51, file$a, 386, 4, 9894);
    			attr_dev(div7, "class", "cart card p-3 svelte-1g115y4");
    			add_location(div7, file$a, 385, 3, 9861);
    			add_location(p1, file$a, 408, 22, 11018);
    			attr_dev(div8, "class", "col");
    			add_location(div8, file$a, 408, 5, 11001);
    			set_style(p2, "text-align", "right");
    			add_location(p2, file$a, 409, 22, 11063);
    			attr_dev(div9, "class", "col");
    			add_location(div9, file$a, 409, 5, 11046);
    			attr_dev(div10, "class", "row bill_row_1");
    			add_location(div10, file$a, 407, 4, 10966);
    			add_location(p3, file$a, 412, 22, 11209);
    			attr_dev(div11, "class", "col");
    			add_location(div11, file$a, 412, 5, 11192);
    			set_style(p4, "text-align", "right");
    			add_location(p4, file$a, 413, 22, 11251);
    			attr_dev(div12, "class", "col");
    			add_location(div12, file$a, 413, 5, 11234);
    			attr_dev(div13, "class", "row bill_row_2");
    			add_location(div13, file$a, 411, 4, 11157);
    			attr_dev(p5, "class", "svelte-1g115y4");
    			add_location(p5, file$a, 416, 22, 11393);
    			attr_dev(div14, "class", "col");
    			add_location(div14, file$a, 416, 5, 11376);
    			set_style(p6, "text-align", "right");
    			attr_dev(p6, "class", "svelte-1g115y4");
    			add_location(p6, file$a, 417, 22, 11435);
    			attr_dev(div15, "class", "col");
    			add_location(div15, file$a, 417, 5, 11418);
    			attr_dev(div16, "class", "row bill_row_3 svelte-1g115y4");
    			add_location(div16, file$a, 415, 4, 11341);
    			attr_dev(hr, "class", "mt-0 mb-3");
    			add_location(hr, file$a, 419, 4, 11526);
    			attr_dev(button0, "class", "col-lg-12 btn btn-primary");
    			add_location(button0, file$a, 421, 5, 11589);
    			attr_dev(button1, "class", "col-lg-12 btn btn-outline-success mt-2");
    			add_location(button1, file$a, 422, 5, 11699);
    			attr_dev(button2, "class", "col-lg-12 btn btn-outline-danger mt-2");
    			add_location(button2, file$a, 423, 5, 11815);
    			attr_dev(div17, "class", "row ml-2 mr-2");
    			add_location(div17, file$a, 420, 4, 11555);
    			attr_dev(div18, "class", "card p-3");
    			add_location(div18, file$a, 406, 3, 10938);
    			attr_dev(div19, "class", "col-lg-4");
    			add_location(div19, file$a, 382, 3, 9814);
    			attr_dev(div20, "class", "row");
    			add_location(div20, file$a, 343, 2, 8040);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div20, anchor);
    			append_dev(div20, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div0, h50);
    			append_dev(div0, t3);
    			append_dev(div0, p0);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, input);
    			set_input_value(input, /*searchBox*/ ctx[3]);
    			append_dev(div2, t6);
    			append_dev(div2, div1);
    			append_dev(div1, span1);
    			append_dev(span1, i);
    			append_dev(div4, t7);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div4, null);
    			}

    			append_dev(div5, t8);
    			append_dev(div5, nav);
    			append_dev(nav, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div20, t9);
    			append_dev(div20, div19);
    			append_dev(div19, div7);
    			append_dev(div7, h51);
    			append_dev(div7, t11);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div7, null);
    			}

    			append_dev(div19, t12);
    			append_dev(div19, div18);
    			append_dev(div18, div10);
    			append_dev(div10, div8);
    			append_dev(div8, p1);
    			append_dev(div10, t14);
    			append_dev(div10, div9);
    			append_dev(div9, p2);
    			append_dev(p2, t15);
    			append_dev(div18, t16);
    			append_dev(div18, div13);
    			append_dev(div13, div11);
    			append_dev(div11, p3);
    			append_dev(div13, t18);
    			append_dev(div13, div12);
    			append_dev(div12, p4);
    			append_dev(p4, t19);
    			append_dev(div18, t20);
    			append_dev(div18, div16);
    			append_dev(div16, div14);
    			append_dev(div14, p5);
    			append_dev(div16, t22);
    			append_dev(div16, div15);
    			append_dev(div15, p6);
    			append_dev(p6, t23);
    			append_dev(div18, t24);
    			append_dev(div18, hr);
    			append_dev(div18, t25);
    			append_dev(div18, div17);
    			append_dev(div17, button0);
    			append_dev(div17, t27);
    			append_dev(div17, button1);
    			append_dev(div17, t29);
    			append_dev(div17, button2);
    			current = true;

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[17]),
    				listen_dev(button0, "click", /*click_handler_3*/ ctx[22], false, false, false),
    				listen_dev(button1, "click", /*click_handler_4*/ ctx[23], false, false, false),
    				listen_dev(button2, "click", /*click_handler_5*/ ctx[24], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*searchBox*/ 8 && input.value !== /*searchBox*/ ctx[3]) {
    				set_input_value(input, /*searchBox*/ ctx[3]);
    			}

    			if (dirty[0] & /*addToCart, data_bind, active_first, active_last*/ 1796) {
    				each_value_2 = /*data_bind*/ ctx[2];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2$2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div4, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty[0] & /*active_now, num_of_page, choosePage*/ 4288) {
    				each_value_1 = /*num_of_page*/ ctx[6];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$3(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(div7, null);
    				} else {
    					if_block = null;
    				}
    			}

    			if ((!current || dirty[0] & /*bill*/ 16) && t15_value !== (t15_value = formatRupiah$3(/*bill*/ ctx[4].sub_total, "Rp. ") + "")) set_data_dev(t15, t15_value);
    			if ((!current || dirty[0] & /*bill*/ 16) && t19_value !== (t19_value = formatRupiah$3(/*bill*/ ctx[4].taxes, "Rp. ") + "")) set_data_dev(t19, t19_value);
    			if ((!current || dirty[0] & /*bill*/ 16) && t23_value !== (t23_value = formatRupiah$3(/*bill*/ ctx[4].total, "Rp. ") + "")) set_data_dev(t23, t23_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div20);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(342:1) {#if id == \\\"pembelian-baru\\\"}",
    		ctx
    	});

    	return block;
    }

    // (514:48) 
    function create_if_block_9$2(ctx) {
    	let current;

    	const invoice = new Invoice({
    			props: { invoice_data: /*purchaseDetail*/ ctx[5] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(invoice.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(invoice, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const invoice_changes = {};
    			if (dirty[0] & /*purchaseDetail*/ 32) invoice_changes.invoice_data = /*purchaseDetail*/ ctx[5];
    			invoice.$set(invoice_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(invoice.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(invoice.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(invoice, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9$2.name,
    		type: "if",
    		source: "(514:48) ",
    		ctx
    	});

    	return block;
    }

    // (429:2) {#if purchaseDetail.purchase_status == 0}
    function create_if_block_5$2(ctx) {
    	let span0;
    	let t1;
    	let div20;
    	let div6;
    	let div5;
    	let div4;
    	let div0;
    	let h50;
    	let t3;
    	let p0;
    	let t5;
    	let div3;
    	let div2;
    	let input;
    	let t6;
    	let div1;
    	let span1;
    	let i;
    	let t7;
    	let t8;
    	let nav;
    	let ul;
    	let t9;
    	let div19;
    	let div7;
    	let h51;
    	let t11;
    	let current_block_type_index;
    	let if_block;
    	let t12;
    	let div18;
    	let div10;
    	let div8;
    	let p1;
    	let t14;
    	let div9;
    	let p2;
    	let t15_value = formatRupiah$3(/*bill*/ ctx[4].sub_total, "Rp. ") + "";
    	let t15;
    	let t16;
    	let div13;
    	let div11;
    	let p3;
    	let t18;
    	let div12;
    	let p4;
    	let t19_value = formatRupiah$3(/*bill*/ ctx[4].taxes, "Rp. ") + "";
    	let t19;
    	let t20;
    	let div16;
    	let div14;
    	let p5;
    	let t22;
    	let div15;
    	let p6;
    	let t23_value = formatRupiah$3(/*bill*/ ctx[4].total, "Rp. ") + "";
    	let t23;
    	let t24;
    	let hr;
    	let t25;
    	let div17;
    	let button0;
    	let t27;
    	let button1;
    	let t29;
    	let button2;
    	let current;
    	let dispose;
    	let each_value_5 = /*data_bind*/ ctx[2];
    	validate_each_argument(each_value_5);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks_1[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	let each_value_4 = /*num_of_page*/ ctx[6];
    	validate_each_argument(each_value_4);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	const if_block_creators = [create_if_block_6$2, create_if_block_7$2];
    	const if_blocks = [];

    	function select_block_type_3(ctx, dirty) {
    		if (/*cart*/ ctx[1].length > 0) return 0;
    		if (/*cart*/ ctx[1].length == 0) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_3(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			span0.textContent = "BELUM CHECKOUT";
    			t1 = space();
    			div20 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			h50 = element("h5");
    			h50.textContent = "Daftar Pembelian Produk";
    			t3 = space();
    			p0 = element("p");
    			p0.textContent = "Lakukan pembelian produk disini";
    			t5 = space();
    			div3 = element("div");
    			div2 = element("div");
    			input = element("input");
    			t6 = space();
    			div1 = element("div");
    			span1 = element("span");
    			i = element("i");
    			t7 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t8 = space();
    			nav = element("nav");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t9 = space();
    			div19 = element("div");
    			div7 = element("div");
    			h51 = element("h5");
    			h51.textContent = "Checkout";
    			t11 = space();
    			if (if_block) if_block.c();
    			t12 = space();
    			div18 = element("div");
    			div10 = element("div");
    			div8 = element("div");
    			p1 = element("p");
    			p1.textContent = "Subtotal";
    			t14 = space();
    			div9 = element("div");
    			p2 = element("p");
    			t15 = text(t15_value);
    			t16 = space();
    			div13 = element("div");
    			div11 = element("div");
    			p3 = element("p");
    			p3.textContent = "Pajak";
    			t18 = space();
    			div12 = element("div");
    			p4 = element("p");
    			t19 = text(t19_value);
    			t20 = space();
    			div16 = element("div");
    			div14 = element("div");
    			p5 = element("p");
    			p5.textContent = "Total";
    			t22 = space();
    			div15 = element("div");
    			p6 = element("p");
    			t23 = text(t23_value);
    			t24 = space();
    			hr = element("hr");
    			t25 = space();
    			div17 = element("div");
    			button0 = element("button");
    			button0.textContent = "Checkout";
    			t27 = space();
    			button1 = element("button");
    			button1.textContent = "Simpan";
    			t29 = space();
    			button2 = element("button");
    			button2.textContent = "Batal";
    			attr_dev(span0, "class", "badge badge-pill badge-danger");
    			add_location(span0, file$a, 429, 3, 12035);
    			attr_dev(h50, "class", "title mb-1 mt-1 svelte-1g115y4");
    			add_location(h50, file$a, 435, 8, 12276);
    			add_location(p0, file$a, 436, 8, 12342);
    			attr_dev(div0, "class", "col-lg-8 mb-3");
    			add_location(div0, file$a, 434, 7, 12239);
    			attr_dev(input, "class", "form-control svelte-1g115y4");
    			attr_dev(input, "placeholder", "Cari disini..");
    			attr_dev(input, "type", "text");
    			add_location(input, file$a, 440, 25, 12493);
    			set_style(i, "cursor", "pointer");
    			attr_dev(i, "class", "fa fa-search");
    			add_location(i, file$a, 442, 58, 12705);
    			attr_dev(span1, "class", "input-group-text");
    			add_location(span1, file$a, 442, 27, 12674);
    			attr_dev(div1, "class", "input-group-append");
    			add_location(div1, file$a, 441, 25, 12613);
    			attr_dev(div2, "class", "input-group mt-2");
    			add_location(div2, file$a, 439, 8, 12436);
    			attr_dev(div3, "class", "col-lg-4");
    			add_location(div3, file$a, 438, 7, 12404);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$a, 433, 6, 12213);
    			attr_dev(ul, "class", "pagination pagination-lg");
    			add_location(ul, file$a, 459, 12, 13538);
    			set_style(nav, "margin-top", "12px");
    			set_style(nav, "position", "absolute");
    			set_style(nav, "left", "20px");
    			set_style(nav, "bottom", "10px");
    			add_location(nav, file$a, 458, 6, 13454);
    			attr_dev(div5, "class", "product mt-1 svelte-1g115y4");
    			set_style(div5, "height", "640px");
    			add_location(div5, file$a, 432, 5, 12157);
    			attr_dev(div6, "class", "col-lg-8");
    			add_location(div6, file$a, 431, 4, 12128);
    			attr_dev(h51, "class", "title mb-3 svelte-1g115y4");
    			add_location(h51, file$a, 473, 4, 13959);
    			attr_dev(div7, "class", "cart card p-3 svelte-1g115y4");
    			add_location(div7, file$a, 472, 3, 13926);
    			add_location(p1, file$a, 494, 22, 15066);
    			attr_dev(div8, "class", "col");
    			add_location(div8, file$a, 494, 5, 15049);
    			set_style(p2, "text-align", "right");
    			add_location(p2, file$a, 495, 22, 15111);
    			attr_dev(div9, "class", "col");
    			add_location(div9, file$a, 495, 5, 15094);
    			attr_dev(div10, "class", "row bill_row_1");
    			add_location(div10, file$a, 493, 4, 15014);
    			add_location(p3, file$a, 498, 22, 15257);
    			attr_dev(div11, "class", "col");
    			add_location(div11, file$a, 498, 5, 15240);
    			set_style(p4, "text-align", "right");
    			add_location(p4, file$a, 499, 22, 15299);
    			attr_dev(div12, "class", "col");
    			add_location(div12, file$a, 499, 5, 15282);
    			attr_dev(div13, "class", "row bill_row_2");
    			add_location(div13, file$a, 497, 4, 15205);
    			attr_dev(p5, "class", "svelte-1g115y4");
    			add_location(p5, file$a, 502, 22, 15441);
    			attr_dev(div14, "class", "col");
    			add_location(div14, file$a, 502, 5, 15424);
    			set_style(p6, "text-align", "right");
    			attr_dev(p6, "class", "svelte-1g115y4");
    			add_location(p6, file$a, 503, 22, 15483);
    			attr_dev(div15, "class", "col");
    			add_location(div15, file$a, 503, 5, 15466);
    			attr_dev(div16, "class", "row bill_row_3 svelte-1g115y4");
    			add_location(div16, file$a, 501, 4, 15389);
    			attr_dev(hr, "class", "mt-0 mb-3");
    			add_location(hr, file$a, 505, 4, 15574);
    			attr_dev(button0, "class", "col-lg-12 btn btn-primary");
    			add_location(button0, file$a, 507, 5, 15637);
    			attr_dev(button1, "class", "col-lg-12 btn btn-outline-success mt-2");
    			add_location(button1, file$a, 508, 5, 15747);
    			attr_dev(button2, "class", "col-lg-12 btn btn-outline-danger mt-2");
    			add_location(button2, file$a, 509, 5, 15863);
    			attr_dev(div17, "class", "row ml-2 mr-2");
    			add_location(div17, file$a, 506, 4, 15603);
    			attr_dev(div18, "class", "card p-3");
    			add_location(div18, file$a, 492, 3, 14986);
    			attr_dev(div19, "class", "col-lg-4");
    			add_location(div19, file$a, 469, 3, 13879);
    			attr_dev(div20, "class", "row");
    			add_location(div20, file$a, 430, 3, 12105);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div20, anchor);
    			append_dev(div20, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div0, h50);
    			append_dev(div0, t3);
    			append_dev(div0, p0);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, input);
    			set_input_value(input, /*searchBox*/ ctx[3]);
    			append_dev(div2, t6);
    			append_dev(div2, div1);
    			append_dev(div1, span1);
    			append_dev(span1, i);
    			append_dev(div4, t7);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div4, null);
    			}

    			append_dev(div5, t8);
    			append_dev(div5, nav);
    			append_dev(nav, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div20, t9);
    			append_dev(div20, div19);
    			append_dev(div19, div7);
    			append_dev(div7, h51);
    			append_dev(div7, t11);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div7, null);
    			}

    			append_dev(div19, t12);
    			append_dev(div19, div18);
    			append_dev(div18, div10);
    			append_dev(div10, div8);
    			append_dev(div8, p1);
    			append_dev(div10, t14);
    			append_dev(div10, div9);
    			append_dev(div9, p2);
    			append_dev(p2, t15);
    			append_dev(div18, t16);
    			append_dev(div18, div13);
    			append_dev(div13, div11);
    			append_dev(div11, p3);
    			append_dev(div13, t18);
    			append_dev(div13, div12);
    			append_dev(div12, p4);
    			append_dev(p4, t19);
    			append_dev(div18, t20);
    			append_dev(div18, div16);
    			append_dev(div16, div14);
    			append_dev(div14, p5);
    			append_dev(div16, t22);
    			append_dev(div16, div15);
    			append_dev(div15, p6);
    			append_dev(p6, t23);
    			append_dev(div18, t24);
    			append_dev(div18, hr);
    			append_dev(div18, t25);
    			append_dev(div18, div17);
    			append_dev(div17, button0);
    			append_dev(div17, t27);
    			append_dev(div17, button1);
    			append_dev(div17, t29);
    			append_dev(div17, button2);
    			current = true;

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler_2*/ ctx[25]),
    				listen_dev(button0, "click", /*click_handler_9*/ ctx[30], false, false, false),
    				listen_dev(button1, "click", /*click_handler_10*/ ctx[31], false, false, false),
    				listen_dev(button2, "click", /*click_handler_11*/ ctx[32], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*searchBox*/ 8 && input.value !== /*searchBox*/ ctx[3]) {
    				set_input_value(input, /*searchBox*/ ctx[3]);
    			}

    			if (dirty[0] & /*addToCart, data_bind, active_first, active_last*/ 1796) {
    				each_value_5 = /*data_bind*/ ctx[2];
    				validate_each_argument(each_value_5);
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_5(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div4, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_5.length;
    			}

    			if (dirty[0] & /*active_now, num_of_page, choosePage*/ 4288) {
    				each_value_4 = /*num_of_page*/ ctx[6];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_4.length;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_3(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(div7, null);
    				} else {
    					if_block = null;
    				}
    			}

    			if ((!current || dirty[0] & /*bill*/ 16) && t15_value !== (t15_value = formatRupiah$3(/*bill*/ ctx[4].sub_total, "Rp. ") + "")) set_data_dev(t15, t15_value);
    			if ((!current || dirty[0] & /*bill*/ 16) && t19_value !== (t19_value = formatRupiah$3(/*bill*/ ctx[4].taxes, "Rp. ") + "")) set_data_dev(t19, t19_value);
    			if ((!current || dirty[0] & /*bill*/ 16) && t23_value !== (t23_value = formatRupiah$3(/*bill*/ ctx[4].total, "Rp. ") + "")) set_data_dev(t23, t23_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div20);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$2.name,
    		type: "if",
    		source: "(429:2) {#if purchaseDetail.purchase_status == 0}",
    		ctx
    	});

    	return block;
    }

    // (448:8) {#if i >= active_first - 1 && i < active_last && product[4].data == 1}
    function create_if_block_8$2(ctx) {
    	let div1;
    	let div0;
    	let p0;
    	let t0_value = /*product*/ ctx[39][1].data + "";
    	let t0;
    	let t1;
    	let p1;
    	let t2_value = formatRupiah$3(/*product*/ ctx[39][2].data, "Rp. ") + "";
    	let t2;
    	let t3;
    	let t4;
    	let button;
    	let i;
    	let t5;
    	let t6;
    	let dispose;

    	function click_handler_6(...args) {
    		return /*click_handler_6*/ ctx[26](/*i*/ ctx[35], ...args);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(t2_value);
    			t3 = text("/pcs");
    			t4 = space();
    			button = element("button");
    			i = element("i");
    			t5 = text("TAMBAHKAN");
    			t6 = space();
    			attr_dev(p0, "class", "mb-1");
    			set_style(p0, "font-size", "1.0rem");
    			add_location(p0, file$a, 450, 11, 13045);
    			attr_dev(p1, "class", "mb-2");
    			set_style(p1, "font-weight", "bold");
    			set_style(p1, "font-size", "0.8rem");
    			add_location(p1, file$a, 451, 11, 13120);
    			attr_dev(i, "class", "fa fa-plus p-2 bg-success ");
    			add_location(i, file$a, 452, 78, 13306);
    			attr_dev(button, "class", "btn btn-success btn-sm");
    			add_location(button, file$a, 452, 11, 13239);
    			attr_dev(div0, "class", "card p-3");
    			add_location(div0, file$a, 449, 10, 13010);
    			attr_dev(div1, "class", "col-lg-4");
    			add_location(div1, file$a, 448, 9, 12975);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, p1);
    			append_dev(p1, t2);
    			append_dev(p1, t3);
    			append_dev(div0, t4);
    			append_dev(div0, button);
    			append_dev(button, i);
    			append_dev(button, t5);
    			append_dev(div1, t6);
    			dispose = listen_dev(button, "click", click_handler_6, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*data_bind*/ 4 && t0_value !== (t0_value = /*product*/ ctx[39][1].data + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*data_bind*/ 4 && t2_value !== (t2_value = formatRupiah$3(/*product*/ ctx[39][2].data, "Rp. ") + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8$2.name,
    		type: "if",
    		source: "(448:8) {#if i >= active_first - 1 && i < active_last && product[4].data == 1}",
    		ctx
    	});

    	return block;
    }

    // (447:7) {#each data_bind as product, i}
    function create_each_block_5(ctx) {
    	let if_block_anchor;
    	let if_block = /*i*/ ctx[35] >= /*active_first*/ ctx[8] - 1 && /*i*/ ctx[35] < /*active_last*/ ctx[9] && /*product*/ ctx[39][4].data == 1 && create_if_block_8$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*i*/ ctx[35] >= /*active_first*/ ctx[8] - 1 && /*i*/ ctx[35] < /*active_last*/ ctx[9] && /*product*/ ctx[39][4].data == 1) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_8$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(447:7) {#each data_bind as product, i}",
    		ctx
    	});

    	return block;
    }

    // (461:14) {#each num_of_page as page}
    function create_each_block_4(ctx) {
    	let li;
    	let a;
    	let t_value = /*page*/ ctx[36] + "";
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "class", "page-link");
    			add_location(a, file$a, 461, 108, 13728);
    			attr_dev(li, "class", "page-item");
    			toggle_class(li, "active", /*active_now*/ ctx[7] === /*page*/ ctx[36]);
    			add_location(li, file$a, 461, 17, 13637);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t);

    			dispose = listen_dev(
    				li,
    				"click",
    				function () {
    					if (is_function(/*choosePage*/ ctx[12](/*page*/ ctx[36]))) /*choosePage*/ ctx[12](/*page*/ ctx[36]).apply(this, arguments);
    				},
    				false,
    				false,
    				false
    			);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*num_of_page*/ 64 && t_value !== (t_value = /*page*/ ctx[36] + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*active_now, num_of_page*/ 192) {
    				toggle_class(li, "active", /*active_now*/ ctx[7] === /*page*/ ctx[36]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(461:14) {#each num_of_page as page}",
    		ctx
    	});

    	return block;
    }

    // (487:31) 
    function create_if_block_7$2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Belum ada produk yang dipilih";
    			add_location(p, file$a, 487, 5, 14900);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7$2.name,
    		type: "if",
    		source: "(487:31) ",
    		ctx
    	});

    	return block;
    }

    // (475:4) {#if cart.length > 0}
    function create_if_block_6$2(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_3 = /*cart*/ ctx[1];
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3$2(get_each_context_3$2(ctx, each_value_3, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*cart, itemQuantity*/ 2050) {
    				each_value_3 = /*cart*/ ctx[1];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3$2(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_3$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_3.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_3.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$2.name,
    		type: "if",
    		source: "(475:4) {#if cart.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (476:5) {#each cart as cart_item, i}
    function create_each_block_3$2(ctx) {
    	let div1;
    	let p0;
    	let t0_value = /*cart_item*/ ctx[33].product_name + "";
    	let t0;
    	let t1;
    	let div0;
    	let i0;
    	let t2;
    	let input;
    	let input_updating = false;
    	let t3;
    	let i1;
    	let t4;
    	let p1;
    	let t5;
    	let t6_value = formatRupiah$3(/*cart_item*/ ctx[33].product_price * /*cart_item*/ ctx[33].product_qty, "Rp. ") + "";
    	let t6;
    	let t7;
    	let div1_transition;
    	let current;
    	let dispose;

    	function click_handler_7(...args) {
    		return /*click_handler_7*/ ctx[27](/*i*/ ctx[35], ...args);
    	}

    	function input_input_handler_3() {
    		input_updating = true;
    		/*input_input_handler_3*/ ctx[28].call(input, /*cart_item*/ ctx[33]);
    	}

    	function click_handler_8(...args) {
    		return /*click_handler_8*/ ctx[29](/*i*/ ctx[35], ...args);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");
    			i0 = element("i");
    			t2 = space();
    			input = element("input");
    			t3 = space();
    			i1 = element("i");
    			t4 = space();
    			p1 = element("p");
    			t5 = text("@");
    			t6 = text(t6_value);
    			t7 = space();
    			attr_dev(p0, "class", "m-0 ml-2 product-name svelte-1g115y4");
    			add_location(p0, file$a, 477, 7, 14157);
    			attr_dev(i0, "class", "fa fa-plus p-2 bg-success mr-2 svelte-1g115y4");
    			add_location(i0, file$a, 479, 8, 14299);
    			attr_dev(input, "class", "form-control pl-0 pr-0 svelte-1g115y4");
    			set_style(input, "width", "42px");
    			set_style(input, "height", "26px");
    			set_style(input, "font-size", "0.7rem");
    			set_style(input, "text-align", "center");
    			attr_dev(input, "min", "1");
    			attr_dev(input, "max", "999");
    			attr_dev(input, "type", "number");
    			attr_dev(input, "oninput", "validity.valid||(value=1);");
    			add_location(input, file$a, 480, 8, 14391);
    			attr_dev(i1, "class", "fa fa-minus p-2 bg-danger ml-2 svelte-1g115y4");
    			add_location(i1, file$a, 481, 8, 14615);
    			attr_dev(p1, "class", "m-0 ml-2 product-price svelte-1g115y4");
    			add_location(p1, file$a, 482, 8, 14707);
    			attr_dev(div0, "class", "cart-item-quantity-container ml-2 mt-1 mb-1 flex svelte-1g115y4");
    			add_location(div0, file$a, 478, 7, 14227);
    			attr_dev(div1, "class", "card p-2 cart-item mb-2 svelte-1g115y4");
    			add_location(div1, file$a, 476, 6, 14065);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, p0);
    			append_dev(p0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, i0);
    			append_dev(div0, t2);
    			append_dev(div0, input);
    			set_input_value(input, /*cart_item*/ ctx[33].product_qty);
    			append_dev(div0, t3);
    			append_dev(div0, i1);
    			append_dev(div0, t4);
    			append_dev(div0, p1);
    			append_dev(p1, t5);
    			append_dev(p1, t6);
    			append_dev(div1, t7);
    			current = true;

    			dispose = [
    				listen_dev(i0, "click", click_handler_7, false, false, false),
    				listen_dev(input, "input", input_input_handler_3),
    				listen_dev(i1, "click", click_handler_8, false, false, false)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[0] & /*cart*/ 2) && t0_value !== (t0_value = /*cart_item*/ ctx[33].product_name + "")) set_data_dev(t0, t0_value);

    			if (!input_updating && dirty[0] & /*cart*/ 2) {
    				set_input_value(input, /*cart_item*/ ctx[33].product_qty);
    			}

    			input_updating = false;
    			if ((!current || dirty[0] & /*cart*/ 2) && t6_value !== (t6_value = formatRupiah$3(/*cart_item*/ ctx[33].product_price * /*cart_item*/ ctx[33].product_qty, "Rp. ") + "")) set_data_dev(t6, t6_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { y: -200, duration: 650 }, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { y: -200, duration: 650 }, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3$2.name,
    		type: "each",
    		source: "(476:5) {#each cart as cart_item, i}",
    		ctx
    	});

    	return block;
    }

    // (361:8) {#if i >= active_first - 1 && i < active_last && product[4].data == 1}
    function create_if_block_3$3(ctx) {
    	let div1;
    	let div0;
    	let p0;
    	let t0_value = /*product*/ ctx[39][1].data + "";
    	let t0;
    	let t1;
    	let p1;
    	let t2_value = formatRupiah$3(/*product*/ ctx[39][2].data, "Rp. ") + "";
    	let t2;
    	let t3;
    	let t4;
    	let button;
    	let i;
    	let t5;
    	let t6;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[18](/*i*/ ctx[35], ...args);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(t2_value);
    			t3 = text("/pcs");
    			t4 = space();
    			button = element("button");
    			i = element("i");
    			t5 = text("TAMBAHKAN");
    			t6 = space();
    			attr_dev(p0, "class", "mb-1");
    			set_style(p0, "font-size", "1.0rem");
    			add_location(p0, file$a, 363, 11, 8980);
    			attr_dev(p1, "class", "mb-2");
    			set_style(p1, "font-weight", "bold");
    			set_style(p1, "font-size", "0.8rem");
    			add_location(p1, file$a, 364, 11, 9055);
    			attr_dev(i, "class", "fa fa-plus p-2 bg-success ");
    			add_location(i, file$a, 365, 78, 9241);
    			attr_dev(button, "class", "btn btn-success btn-sm");
    			add_location(button, file$a, 365, 11, 9174);
    			attr_dev(div0, "class", "card p-3");
    			add_location(div0, file$a, 362, 10, 8945);
    			attr_dev(div1, "class", "col-lg-4");
    			add_location(div1, file$a, 361, 9, 8910);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, p1);
    			append_dev(p1, t2);
    			append_dev(p1, t3);
    			append_dev(div0, t4);
    			append_dev(div0, button);
    			append_dev(button, i);
    			append_dev(button, t5);
    			append_dev(div1, t6);
    			dispose = listen_dev(button, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*data_bind*/ 4 && t0_value !== (t0_value = /*product*/ ctx[39][1].data + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*data_bind*/ 4 && t2_value !== (t2_value = formatRupiah$3(/*product*/ ctx[39][2].data, "Rp. ") + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$3.name,
    		type: "if",
    		source: "(361:8) {#if i >= active_first - 1 && i < active_last && product[4].data == 1}",
    		ctx
    	});

    	return block;
    }

    // (360:7) {#each data_bind as product, i}
    function create_each_block_2$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*i*/ ctx[35] >= /*active_first*/ ctx[8] - 1 && /*i*/ ctx[35] < /*active_last*/ ctx[9] && /*product*/ ctx[39][4].data == 1 && create_if_block_3$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*i*/ ctx[35] >= /*active_first*/ ctx[8] - 1 && /*i*/ ctx[35] < /*active_last*/ ctx[9] && /*product*/ ctx[39][4].data == 1) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_3$3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$2.name,
    		type: "each",
    		source: "(360:7) {#each data_bind as product, i}",
    		ctx
    	});

    	return block;
    }

    // (374:14) {#each num_of_page as page}
    function create_each_block_1$3(ctx) {
    	let li;
    	let a;
    	let t_value = /*page*/ ctx[36] + "";
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "class", "page-link");
    			add_location(a, file$a, 374, 108, 9663);
    			attr_dev(li, "class", "page-item");
    			toggle_class(li, "active", /*active_now*/ ctx[7] === /*page*/ ctx[36]);
    			add_location(li, file$a, 374, 17, 9572);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t);

    			dispose = listen_dev(
    				li,
    				"click",
    				function () {
    					if (is_function(/*choosePage*/ ctx[12](/*page*/ ctx[36]))) /*choosePage*/ ctx[12](/*page*/ ctx[36]).apply(this, arguments);
    				},
    				false,
    				false,
    				false
    			);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*num_of_page*/ 64 && t_value !== (t_value = /*page*/ ctx[36] + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*active_now, num_of_page*/ 192) {
    				toggle_class(li, "active", /*active_now*/ ctx[7] === /*page*/ ctx[36]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$3.name,
    		type: "each",
    		source: "(374:14) {#each num_of_page as page}",
    		ctx
    	});

    	return block;
    }

    // (401:31) 
    function create_if_block_2$3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Belum ada produk yang dipilih";
    			add_location(p, file$a, 401, 5, 10852);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(401:31) ",
    		ctx
    	});

    	return block;
    }

    // (388:4) {#if cart.length > 0}
    function create_if_block_1$4(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*cart*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*cart, itemQuantity*/ 2050) {
    				each_value = /*cart*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(388:4) {#if cart.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (389:5) {#each cart as cart_item, i}
    function create_each_block$4(ctx) {
    	let div1;
    	let p0;
    	let t0_value = /*cart_item*/ ctx[33].product_name + "";
    	let t0;
    	let t1;
    	let div0;
    	let i0;
    	let t2;
    	let input;
    	let input_updating = false;
    	let t3;
    	let i1;
    	let t4;
    	let p1;
    	let t5;
    	let t6_value = formatRupiah$3(/*cart_item*/ ctx[33].product_price * /*cart_item*/ ctx[33].product_qty, "Rp. ") + "";
    	let t6;
    	let t7;
    	let div1_transition;
    	let current;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[19](/*i*/ ctx[35], ...args);
    	}

    	function input_input_handler_1() {
    		input_updating = true;
    		/*input_input_handler_1*/ ctx[20].call(input, /*cart_item*/ ctx[33]);
    	}

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[21](/*i*/ ctx[35], ...args);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");
    			i0 = element("i");
    			t2 = space();
    			input = element("input");
    			t3 = space();
    			i1 = element("i");
    			t4 = space();
    			p1 = element("p");
    			t5 = text("@");
    			t6 = text(t6_value);
    			t7 = space();
    			attr_dev(p0, "class", "m-0 ml-2 product-name svelte-1g115y4");
    			add_location(p0, file$a, 391, 8, 10102);
    			attr_dev(i0, "class", "fa fa-plus p-2 bg-success mr-2 svelte-1g115y4");
    			add_location(i0, file$a, 393, 9, 10246);
    			attr_dev(input, "class", "form-control pl-0 pr-0 svelte-1g115y4");
    			set_style(input, "width", "42px");
    			set_style(input, "height", "26px");
    			set_style(input, "font-size", "0.7rem");
    			set_style(input, "text-align", "center");
    			attr_dev(input, "min", "1");
    			attr_dev(input, "max", "999");
    			attr_dev(input, "type", "number");
    			attr_dev(input, "oninput", "validity.valid||(value=1);");
    			add_location(input, file$a, 394, 9, 10339);
    			attr_dev(i1, "class", "fa fa-minus p-2 bg-danger ml-2 svelte-1g115y4");
    			add_location(i1, file$a, 395, 9, 10564);
    			attr_dev(p1, "class", "m-0 ml-2 product-price svelte-1g115y4");
    			add_location(p1, file$a, 396, 9, 10657);
    			attr_dev(div0, "class", "cart-item-quantity-container ml-2 mt-1 mb-1 flex svelte-1g115y4");
    			add_location(div0, file$a, 392, 8, 10173);
    			attr_dev(div1, "class", "card p-2 cart-item mb-2 svelte-1g115y4");
    			add_location(div1, file$a, 390, 7, 10009);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, p0);
    			append_dev(p0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, i0);
    			append_dev(div0, t2);
    			append_dev(div0, input);
    			set_input_value(input, /*cart_item*/ ctx[33].product_qty);
    			append_dev(div0, t3);
    			append_dev(div0, i1);
    			append_dev(div0, t4);
    			append_dev(div0, p1);
    			append_dev(p1, t5);
    			append_dev(p1, t6);
    			append_dev(div1, t7);
    			current = true;

    			dispose = [
    				listen_dev(i0, "click", click_handler_1, false, false, false),
    				listen_dev(input, "input", input_input_handler_1),
    				listen_dev(i1, "click", click_handler_2, false, false, false)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[0] & /*cart*/ 2) && t0_value !== (t0_value = /*cart_item*/ ctx[33].product_name + "")) set_data_dev(t0, t0_value);

    			if (!input_updating && dirty[0] & /*cart*/ 2) {
    				set_input_value(input, /*cart_item*/ ctx[33].product_qty);
    			}

    			input_updating = false;
    			if ((!current || dirty[0] & /*cart*/ 2) && t6_value !== (t6_value = formatRupiah$3(/*cart_item*/ ctx[33].product_price * /*cart_item*/ ctx[33].product_qty, "Rp. ") + "")) set_data_dev(t6, t6_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { y: -200, duration: 650 }, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { y: -200, duration: 650 }, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(389:5) {#each cart as cart_item, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let div;
    	let span;
    	let t0;
    	let t1_value = /*purchaseDetail*/ ctx[5].purchase_id + "";
    	let t1;
    	let t2;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$4, create_if_block_4$3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*id*/ ctx[0] == "pembelian-baru") return 0;
    		if (/*id*/ ctx[0] != "pembelian-baru") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text("ID PEMBELIAN #");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(span, "class", "badge badge-pill badge-primary");
    			add_location(span, file$a, 340, 1, 7841);
    			attr_dev(div, "class", "container svelte-1g115y4");
    			set_style(div, "margin-bottom", "-150px");
    			set_style(div, "margin-top", "20px");
    			add_location(div, file$a, 339, 0, 7769);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(div, t2);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*purchaseDetail*/ 32) && t1_value !== (t1_value = /*purchaseDetail*/ ctx[5].purchase_id + "")) set_data_dev(t1, t1_value);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function formatRupiah$3(angka, prefix) {
    	if (angka != undefined) {
    		angka = angka.toString();
    		var number_string = angka.replace(/[^,\d]/g, "").toString();
    		var split = number_string.split(",");
    		var sisa = split[0].length % 3;
    		var rupiah = split[0].substr(0, sisa);
    		var ribuan = split[0].substr(sisa).match(/\d{3}/gi);
    		var separator;

    		// tambahkan titik jika yang di input sudah menjadi angka ribuan
    		if (ribuan) {
    			separator = sisa ? "." : "";
    			rupiah += separator + ribuan.join(".");
    		}

    		rupiah = split[1] != undefined ? rupiah + "," + split[1] : rupiah;

    		return prefix == undefined
    		? rupiah
    		: rupiah ? "Rp. " + rupiah : "";
    	}

    	return "Rp. 0";
    }

    function generateNewPurchaseId() {
    	var randVal = 101 + Math.random() * (999 - 101);
    	return "102-" + Date.now() + "" + Math.round(randVal);
    }

    function goBack() {
    	window.history.back();
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { id } = $$props;
    	let data_raw = [];
    	let cart = [];
    	let data_bind = [];
    	let searchBox = "";
    	let bill = { sub_total: 0, taxes: 0, total: 0 };

    	let purchaseDetail = {
    		purchase_id: "102",
    		purchase_total: 0,
    		purchase_status: 0,
    		purchase_date: 0,
    		purchase_items: []
    	};

    	// settings for pagination
    	let num_of_page = [];

    	let active_now = 1;
    	let active_first = 1;
    	let active_last = 9;
    	let per_page_date = 9;

    	// on mount
    	onMount(async () => {
    		if (id != "pembelian-baru") {
    			fetch("http://127.0.0.1/lumeraAPI/pos_purchase/getAllproductPurchase.php?purchase_id=" + id, { method: "GET" }).then(res => res.json()).then(data => {
    				$$invalidate(5, purchaseDetail.purchase_id = data.purchase_id, purchaseDetail);
    				$$invalidate(5, purchaseDetail.purchase_status = data.purchase_status, purchaseDetail);
    				$$invalidate(5, purchaseDetail.purchase_total = data.purchase_total, purchaseDetail);
    				$$invalidate(5, purchaseDetail.purchase_date = data.purchase_date, purchaseDetail);
    				$$invalidate(5, purchaseDetail.purchase_items = data.cart, purchaseDetail);
    				$$invalidate(1, cart = data.cart);
    			}).catch(err => {
    				
    			});
    		} else {
    			$$invalidate(5, purchaseDetail.purchase_id = generateNewPurchaseId(), purchaseDetail);
    		}

    		fetch("http://127.0.0.1/lumeraAPI/master_data/getAllProduct.php", { method: "GET" }).then(res => res.json()).then(data => {
    			$$invalidate(14, data_raw = data);
    			$$invalidate(2, data_bind = data);
    			console.log(data_bind);
    			console.log(data_bind[1][1].data);
    		}).catch(err => {
    			
    		});
    	});

    	function addToCart(id) {
    		let i = 0;
    		let alreadyOnCart = false;

    		for (i; i < cart.length; i++) {
    			// only add the qty, if the same item already listed in cart
    			if (cart[i].product_name == data_bind[id][1].data) {
    				alreadyOnCart = true;
    				$$invalidate(1, cart[i].product_qty += 1, cart);
    			}
    		}

    		// add new item to the cart if the same item didn't exist yet
    		if (alreadyOnCart == false) {
    			$$invalidate(1, cart = [
    				...cart,
    				{
    					product_id: data_bind[id][0].data,
    					product_name: data_bind[id][1].data,
    					product_price: data_bind[id][2].data,
    					product_qty: 1
    				}
    			]);
    		}
    	}

    	function itemQuantity(operand, i) {
    		if (operand == "+") {
    			$$invalidate(1, cart[i].product_qty++, cart);
    		} else if (operand == "-") {
    			if (cart[i].product_qty > 1) {
    				$$invalidate(1, cart[i].product_qty--, cart);
    			} else {
    				cart.splice(i, 1);
    				$$invalidate(1, cart);
    			}
    		}
    	}

    	function bindPage(amount_of_data) {
    		let i = 0;
    		$$invalidate(6, num_of_page = []);

    		while (amount_of_data > per_page_date) {
    			i = i + 1;
    			num_of_page.push(i);
    			amount_of_data -= per_page_date;
    		}

    		if (amount_of_data <= per_page_date) {
    			i = i + 1;
    			num_of_page.push(i);
    		}

    		console.log(num_of_page);
    	}

    	function choosePage(page) {
    		if (page == 1) {
    			$$invalidate(8, active_first = 1);
    			$$invalidate(9, active_last = per_page_date);
    		} else {
    			$$invalidate(8, active_first = (page - 1) * per_page_date + 1);
    			$$invalidate(9, active_last = page * per_page_date);
    		}

    		$$invalidate(7, active_now = page);
    		console.log(active_first);
    		console.log(active_last);
    	}

    	function checkoutToApi(statusChooser) {
    		// if status is 0 it means only save
    		// if status is 1 it means checkout
    		let status = 0;

    		if (statusChooser == "checkout") {
    			status = 1;
    		}

    		if (cart.length == 0) {
    			alert("Keranjang checkout tidak boleh kosong");
    		} else {
    			let confirm_changes;

    			if (status == 0) {
    				confirm_changes = confirm("Anda yakin akan menyimpan pembelian ini?\n* Data masih bisa dirubah");
    			} else {
    				confirm_changes = confirm("Anda yakin akan menyimpan pembelian ini?\n* Dengan melakukan checkout data sudah tidak bisa dirubah lagi");
    			}

    			if (confirm_changes == true) {
    				// fill the object 
    				$$invalidate(5, purchaseDetail.purchase_total = bill.total, purchaseDetail);

    				$$invalidate(5, purchaseDetail.purchase_items = cart, purchaseDetail);
    				$$invalidate(5, purchaseDetail.purchase_status = status, purchaseDetail);

    				fetch("http://127.0.0.1/lumeraAPI/pos_purchase/saveProductPurchase.php", {
    					method: "POST",
    					body: JSON.stringify(purchaseDetail),
    					headers: {
    						"Content-Type": "application/x-www-form-urlencoded"
    					}
    				}).then(
    					function (response) {
    						response.status; //=> number 100–599
    						response.statusText; //=> String
    						response.headers; //=> Headers
    						response.url; //=> String
    						alert("Data berhasil disimpan");
    						goBack();
    						console.log(response);
    					},
    					function (error) {
    						error.message; //=> String
    					}
    				);
    			}
    		}
    	}

    	const writable_props = ["id"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<PembelianProdukKecantikan> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PembelianProdukKecantikan", $$slots, []);

    	function input_input_handler() {
    		searchBox = this.value;
    		$$invalidate(3, searchBox);
    	}

    	const click_handler = i => addToCart(i);
    	const click_handler_1 = i => itemQuantity("+", i);

    	function input_input_handler_1(cart_item) {
    		cart_item.product_qty = to_number(this.value);
    		$$invalidate(1, cart);
    	}

    	const click_handler_2 = i => itemQuantity("-", i);
    	const click_handler_3 = () => checkoutToApi("checkout");
    	const click_handler_4 = () => checkoutToApi("save");
    	const click_handler_5 = () => goBack();

    	function input_input_handler_2() {
    		searchBox = this.value;
    		$$invalidate(3, searchBox);
    	}

    	const click_handler_6 = i => addToCart(i);
    	const click_handler_7 = i => itemQuantity("+", i);

    	function input_input_handler_3(cart_item) {
    		cart_item.product_qty = to_number(this.value);
    		$$invalidate(1, cart);
    	}

    	const click_handler_8 = i => itemQuantity("-", i);
    	const click_handler_9 = () => checkoutToApi("checkout");
    	const click_handler_10 = () => checkoutToApi("save");
    	const click_handler_11 = () => goBack();

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Invoice,
    		fade,
    		fly,
    		Link,
    		id,
    		data_raw,
    		cart,
    		data_bind,
    		searchBox,
    		bill,
    		purchaseDetail,
    		num_of_page,
    		active_now,
    		active_first,
    		active_last,
    		per_page_date,
    		formatRupiah: formatRupiah$3,
    		addToCart,
    		itemQuantity,
    		bindPage,
    		choosePage,
    		generateNewPurchaseId,
    		goBack,
    		checkoutToApi
    	});

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("data_raw" in $$props) $$invalidate(14, data_raw = $$props.data_raw);
    		if ("cart" in $$props) $$invalidate(1, cart = $$props.cart);
    		if ("data_bind" in $$props) $$invalidate(2, data_bind = $$props.data_bind);
    		if ("searchBox" in $$props) $$invalidate(3, searchBox = $$props.searchBox);
    		if ("bill" in $$props) $$invalidate(4, bill = $$props.bill);
    		if ("purchaseDetail" in $$props) $$invalidate(5, purchaseDetail = $$props.purchaseDetail);
    		if ("num_of_page" in $$props) $$invalidate(6, num_of_page = $$props.num_of_page);
    		if ("active_now" in $$props) $$invalidate(7, active_now = $$props.active_now);
    		if ("active_first" in $$props) $$invalidate(8, active_first = $$props.active_first);
    		if ("active_last" in $$props) $$invalidate(9, active_last = $$props.active_last);
    		if ("per_page_date" in $$props) per_page_date = $$props.per_page_date;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*cart, bill*/ 18) {
    			// recalculate sub total and total when new or deleted item from cart 
    			 {
    				let i;
    				$$invalidate(4, bill.sub_total = 0, bill);
    				$$invalidate(4, bill.total = 0, bill);

    				for (i = 0; i < cart.length; i++) {
    					$$invalidate(4, bill.sub_total += cart[i].product_price * cart[i].product_qty, bill);
    				}

    				$$invalidate(4, bill.total = bill.sub_total - bill.taxes, bill);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*searchBox, data_raw, data_bind*/ 16396) {
    			 {
    				if (searchBox != "" && data_raw != []) {
    					// reset page
    					$$invalidate(2, data_bind = []);

    					let i = 0;
    					let counter = 0;

    					for (i = 0; i < searchBox.length; i++) {
    						for (let j = 0; j < data_raw.length; j++) {
    							let confirmed = 0;
    							let name = data_raw[j][1].data;

    							for (let c = 0; c < searchBox.length; c++) {
    								if (searchBox[c].toLowerCase() == name[c].toLowerCase()) {
    									confirmed = 1;
    								} else {
    									confirmed = 0;
    									break;
    								}
    							}

    							if (confirmed == 1) {
    								$$invalidate(2, data_bind[counter] = data_raw[j], data_bind);
    								counter++;
    							}
    						}

    						counter = 0;
    					}
    				} else if (searchBox == "" && data_raw != []) {
    					$$invalidate(2, data_bind = data_raw);
    				}

    				bindPage(data_bind.length);
    			}
    		}
    	};

    	return [
    		id,
    		cart,
    		data_bind,
    		searchBox,
    		bill,
    		purchaseDetail,
    		num_of_page,
    		active_now,
    		active_first,
    		active_last,
    		addToCart,
    		itemQuantity,
    		choosePage,
    		checkoutToApi,
    		data_raw,
    		per_page_date,
    		bindPage,
    		input_input_handler,
    		click_handler,
    		click_handler_1,
    		input_input_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		input_input_handler_2,
    		click_handler_6,
    		click_handler_7,
    		input_input_handler_3,
    		click_handler_8,
    		click_handler_9,
    		click_handler_10,
    		click_handler_11
    	];
    }

    class PembelianProdukKecantikan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, { id: 0 }, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PembelianProdukKecantikan",
    			options,
    			id: create_fragment$h.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[0] === undefined && !("id" in props)) {
    			console_1$3.warn("<PembelianProdukKecantikan> was created without expected prop 'id'");
    		}
    	}

    	get id() {
    		throw new Error("<PembelianProdukKecantikan>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<PembelianProdukKecantikan>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\PembelianInventaris.svelte generated by Svelte v3.19.2 */

    const { console: console_1$4 } = globals;
    const file$b = "src\\Pages\\PembelianInventaris.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    // (255:32) 
    function create_if_block_1$5(ctx) {
    	let each_1_anchor;
    	let each_value = /*cart*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectItem, removeItem, formatRupiah, cart*/ 49) {
    				each_value = /*cart*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(255:32) ",
    		ctx
    	});

    	return block;
    }

    // (253:6) {#if cart.length == 0}
    function create_if_block$5(ctx) {
    	let td;

    	const block = {
    		c: function create() {
    			td = element("td");
    			td.textContent = "Belum ada data di cart";
    			add_location(td, file$b, 253, 7, 6909);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(253:6) {#if cart.length == 0}",
    		ctx
    	});

    	return block;
    }

    // (256:7) {#each cart as cart_item, i}
    function create_each_block$5(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*cart_item*/ ctx[17].product_name + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = formatRupiah$4(/*cart_item*/ ctx[17].product_price, "Rp. ") + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*cart_item*/ ctx[17].product_qty + "";
    	let t4;
    	let t5;
    	let t6;
    	let td3;
    	let t7;
    	let t8_value = formatRupiah$4(/*cart_item*/ ctx[17].product_price * /*cart_item*/ ctx[17].product_qty) + "";
    	let t8;
    	let t9;
    	let td4;
    	let button;
    	let i_1;
    	let t10;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[12](/*i*/ ctx[19], ...args);
    	}

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[13](/*i*/ ctx[19], ...args);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = text(" pcs");
    			t6 = space();
    			td3 = element("td");
    			t7 = text("Rp. ");
    			t8 = text(t8_value);
    			t9 = space();
    			td4 = element("td");
    			button = element("button");
    			i_1 = element("i");
    			t10 = space();
    			add_location(td0, file$b, 257, 9, 7092);
    			add_location(td1, file$b, 258, 9, 7136);
    			add_location(td2, file$b, 259, 9, 7203);
    			add_location(td3, file$b, 260, 9, 7250);
    			attr_dev(i_1, "class", "fa fa-trash pt-1");
    			add_location(i_1, file$b, 262, 138, 7500);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "rel", "tooltip");
    			attr_dev(button, "class", "btn btn-danger btn-icon btn-sm ");
    			attr_dev(button, "data-original-title", "");
    			attr_dev(button, "title", "");
    			add_location(button, file$b, 262, 30, 7392);
    			attr_dev(td4, "class", "td-actions");
    			add_location(td4, file$b, 261, 9, 7337);
    			set_style(tr, "cursor", "pointer");
    			add_location(tr, file$b, 256, 8, 7021);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(td2, t5);
    			append_dev(tr, t6);
    			append_dev(tr, td3);
    			append_dev(td3, t7);
    			append_dev(td3, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td4);
    			append_dev(td4, button);
    			append_dev(button, i_1);
    			append_dev(tr, t10);

    			dispose = [
    				listen_dev(i_1, "click", click_handler, false, false, false),
    				listen_dev(tr, "click", click_handler_1, false, false, false)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*cart*/ 1 && t0_value !== (t0_value = /*cart_item*/ ctx[17].product_name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*cart*/ 1 && t2_value !== (t2_value = formatRupiah$4(/*cart_item*/ ctx[17].product_price, "Rp. ") + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*cart*/ 1 && t4_value !== (t4_value = /*cart_item*/ ctx[17].product_qty + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*cart*/ 1 && t8_value !== (t8_value = formatRupiah$4(/*cart_item*/ ctx[17].product_price * /*cart_item*/ ctx[17].product_qty) + "")) set_data_dev(t8, t8_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(256:7) {#each cart as cart_item, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let div14;
    	let span0;
    	let t0;
    	let t1_value = /*purchaseDetail*/ ctx[2].purchase_id + "";
    	let t1;
    	let t2;
    	let span1;
    	let t4;
    	let div13;
    	let div5;
    	let div4;
    	let form;
    	let h5;
    	let t6;
    	let div0;
    	let label0;
    	let t8;
    	let input0;
    	let t9;
    	let div1;
    	let label1;
    	let t11;
    	let input1;
    	let input1_updating = false;
    	let t12;
    	let input2;
    	let input2_value_value;
    	let t13;
    	let div2;
    	let label2;
    	let t15;
    	let input3;
    	let input3_updating = false;
    	let t16;
    	let div3;
    	let button0;
    	let t18;
    	let div12;
    	let div6;
    	let table;
    	let thead;
    	let th0;
    	let t20;
    	let th1;
    	let t22;
    	let th2;
    	let t24;
    	let th3;
    	let t26;
    	let th4;
    	let t28;
    	let tbody;
    	let t29;
    	let div11;
    	let div10;
    	let div8;
    	let div7;
    	let p0;
    	let t31;
    	let p1;
    	let t32_value = formatRupiah$4(/*purchaseDetail*/ ctx[2].purchase_total, "Rp. ") + "";
    	let t32;
    	let t33;
    	let div9;
    	let button1;
    	let t35;
    	let button2;
    	let t37;
    	let button3;
    	let dispose;

    	function input1_input_handler() {
    		input1_updating = true;
    		/*input1_input_handler*/ ctx[10].call(input1);
    	}

    	function input3_input_handler() {
    		input3_updating = true;
    		/*input3_input_handler*/ ctx[11].call(input3);
    	}

    	function select_block_type(ctx, dirty) {
    		if (/*cart*/ ctx[0].length == 0) return create_if_block$5;
    		if (/*cart*/ ctx[0].length > 0) return create_if_block_1$5;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div14 = element("div");
    			span0 = element("span");
    			t0 = text("ID PEMBELIAN #");
    			t1 = text(t1_value);
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "PEMBELIAN BARU";
    			t4 = space();
    			div13 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			form = element("form");
    			h5 = element("h5");
    			h5.textContent = "Tambah Pembelian Inventaris";
    			t6 = space();
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Nama Item";
    			t8 = space();
    			input0 = element("input");
    			t9 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Harga Item";
    			t11 = space();
    			input1 = element("input");
    			t12 = space();
    			input2 = element("input");
    			t13 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "Jumlah Item";
    			t15 = space();
    			input3 = element("input");
    			t16 = space();
    			div3 = element("div");
    			button0 = element("button");
    			button0.textContent = "SIMPAN";
    			t18 = space();
    			div12 = element("div");
    			div6 = element("div");
    			table = element("table");
    			thead = element("thead");
    			th0 = element("th");
    			th0.textContent = "Nama Produk";
    			t20 = space();
    			th1 = element("th");
    			th1.textContent = "Harga Satuan";
    			t22 = space();
    			th2 = element("th");
    			th2.textContent = "Qty";
    			t24 = space();
    			th3 = element("th");
    			th3.textContent = "Total";
    			t26 = space();
    			th4 = element("th");
    			th4.textContent = "Aksi";
    			t28 = space();
    			tbody = element("tbody");
    			if (if_block) if_block.c();
    			t29 = space();
    			div11 = element("div");
    			div10 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			p0 = element("p");
    			p0.textContent = "Total";
    			t31 = space();
    			p1 = element("p");
    			t32 = text(t32_value);
    			t33 = space();
    			div9 = element("div");
    			button1 = element("button");
    			button1.textContent = "Checkout";
    			t35 = space();
    			button2 = element("button");
    			button2.textContent = "Simpan";
    			t37 = space();
    			button3 = element("button");
    			button3.textContent = "Batal";
    			attr_dev(span0, "class", "badge badge-pill badge-primary mb-2");
    			add_location(span0, file$b, 191, 1, 4718);
    			attr_dev(span1, "class", "badge badge-pill badge-success");
    			add_location(span1, file$b, 192, 1, 4820);
    			set_style(h5, "margin-left", "20px");
    			set_style(h5, "margin-top", "20px");
    			set_style(h5, "margin-bottom", "20px");
    			set_style(h5, "font-weight", "bold");
    			add_location(h5, file$b, 203, 5, 5120);
    			attr_dev(label0, "for", "service important-form");
    			add_location(label0, file$b, 207, 6, 5325);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Masukkan Nama Barang");
    			input0.required = "true";
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "service");
    			add_location(input0, file$b, 208, 6, 5386);
    			attr_dev(div0, "class", "form-group col-md-12 ml-1 mr-1");
    			add_location(div0, file$b, 206, 5, 5273);
    			attr_dev(label1, "for", "service important-form");
    			add_location(label1, file$b, 213, 6, 5630);
    			attr_dev(input1, "type", "number");
    			input1.required = "true";
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "id", "service");
    			attr_dev(input1, "placeholder", "Masukkan Harga");
    			add_location(input1, file$b, 214, 6, 5692);
    			attr_dev(input2, "type", "text");
    			set_style(input2, "margin-top", "10px");
    			input2.disabled = "true";
    			input2.value = input2_value_value = formatRupiah$4(/*input_data*/ ctx[1].product_price, "Rp");
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "id", "service");
    			attr_dev(input2, "placeholder", "Rp. 0");
    			add_location(input2, file$b, 215, 6, 5840);
    			attr_dev(div1, "class", "form-group col-md-12 ml-1 mr-1");
    			add_location(div1, file$b, 212, 5, 5578);
    			attr_dev(label2, "for", "service important-form");
    			add_location(label2, file$b, 220, 6, 6109);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "placeholder", "Masukkan Jumlah Barang");
    			input3.required = "true";
    			attr_dev(input3, "class", "form-control");
    			attr_dev(input3, "id", "service");
    			add_location(input3, file$b, 221, 6, 6172);
    			attr_dev(div2, "class", "form-group col-md-12 ml-1 mr-1");
    			add_location(div2, file$b, 219, 5, 6057);
    			attr_dev(button0, "type", "submit");
    			attr_dev(button0, "class", "btn btn-primary");
    			add_location(button0, file$b, 225, 12, 6379);
    			attr_dev(div3, "class", "card-footer");
    			add_location(div3, file$b, 224, 5, 6340);
    			attr_dev(form, "class", "mt-3");
    			add_location(form, file$b, 201, 4, 5025);
    			attr_dev(div4, "class", "card card-primary card-outline");
    			add_location(div4, file$b, 199, 3, 4973);
    			attr_dev(div5, "class", "col-lg-5");
    			add_location(div5, file$b, 197, 2, 4944);
    			add_location(th0, file$b, 244, 6, 6727);
    			add_location(th1, file$b, 245, 6, 6755);
    			add_location(th2, file$b, 246, 6, 6784);
    			add_location(th3, file$b, 247, 6, 6804);
    			add_location(th4, file$b, 248, 6, 6826);
    			add_location(thead, file$b, 243, 5, 6712);
    			add_location(tbody, file$b, 251, 5, 6863);
    			attr_dev(table, "class", "table");
    			add_location(table, file$b, 241, 4, 6682);
    			attr_dev(div6, "class", "card card-primary card-outline");
    			set_style(div6, "height", "300px");
    			set_style(div6, "overflow-y", "scroll");
    			add_location(div6, file$b, 239, 3, 6584);
    			set_style(p0, "font-weight", "bold");
    			set_style(p0, "margin-bottom", "0px");
    			set_style(p0, "margin-top", "10px");
    			add_location(p0, file$b, 278, 7, 7844);
    			set_style(p1, "font-family", "bold");
    			set_style(p1, "font-family", "'Lato'");
    			set_style(p1, "font-size", "18px");
    			set_style(p1, "margin-top", "0px");
    			add_location(p1, file$b, 279, 7, 7928);
    			attr_dev(div7, "class", "ml-4");
    			add_location(div7, file$b, 277, 6, 7817);
    			attr_dev(div8, "class", "col-lg-4");
    			add_location(div8, file$b, 276, 5, 7787);
    			attr_dev(button1, "class", "col btn btn-primary");
    			add_location(button1, file$b, 283, 6, 8162);
    			attr_dev(button2, "class", "col btn btn-outline-success");
    			add_location(button2, file$b, 284, 6, 8267);
    			attr_dev(button3, "class", "col btn btn-outline-danger");
    			add_location(button3, file$b, 285, 6, 8373);
    			attr_dev(div9, "class", "col-lg-8 row mt-4");
    			set_style(div9, "height", "20px");
    			add_location(div9, file$b, 282, 5, 8101);
    			attr_dev(div10, "class", "row");
    			add_location(div10, file$b, 275, 4, 7763);
    			attr_dev(div11, "class", "card card-primary card-outline");
    			add_location(div11, file$b, 274, 3, 7713);
    			attr_dev(div12, "class", "col-lg-7");
    			add_location(div12, file$b, 237, 2, 6551);
    			attr_dev(div13, "class", "row");
    			add_location(div13, file$b, 194, 1, 4891);
    			attr_dev(div14, "class", "container mt-5 svelte-ambdx");
    			add_location(div14, file$b, 189, 0, 4685);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div14, anchor);
    			append_dev(div14, span0);
    			append_dev(span0, t0);
    			append_dev(span0, t1);
    			append_dev(div14, t2);
    			append_dev(div14, span1);
    			append_dev(div14, t4);
    			append_dev(div14, div13);
    			append_dev(div13, div5);
    			append_dev(div5, div4);
    			append_dev(div4, form);
    			append_dev(form, h5);
    			append_dev(form, t6);
    			append_dev(form, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t8);
    			append_dev(div0, input0);
    			set_input_value(input0, /*input_data*/ ctx[1].product_name);
    			append_dev(form, t9);
    			append_dev(form, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t11);
    			append_dev(div1, input1);
    			set_input_value(input1, /*input_data*/ ctx[1].product_price);
    			append_dev(div1, t12);
    			append_dev(div1, input2);
    			append_dev(form, t13);
    			append_dev(form, div2);
    			append_dev(div2, label2);
    			append_dev(div2, t15);
    			append_dev(div2, input3);
    			set_input_value(input3, /*input_data*/ ctx[1].product_qty);
    			append_dev(form, t16);
    			append_dev(form, div3);
    			append_dev(div3, button0);
    			append_dev(div13, t18);
    			append_dev(div13, div12);
    			append_dev(div12, div6);
    			append_dev(div6, table);
    			append_dev(table, thead);
    			append_dev(thead, th0);
    			append_dev(thead, t20);
    			append_dev(thead, th1);
    			append_dev(thead, t22);
    			append_dev(thead, th2);
    			append_dev(thead, t24);
    			append_dev(thead, th3);
    			append_dev(thead, t26);
    			append_dev(thead, th4);
    			append_dev(table, t28);
    			append_dev(table, tbody);
    			if (if_block) if_block.m(tbody, null);
    			append_dev(div12, t29);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div10, div8);
    			append_dev(div8, div7);
    			append_dev(div7, p0);
    			append_dev(div7, t31);
    			append_dev(div7, p1);
    			append_dev(p1, t32);
    			append_dev(div10, t33);
    			append_dev(div10, div9);
    			append_dev(div9, button1);
    			append_dev(div9, t35);
    			append_dev(div9, button2);
    			append_dev(div9, t37);
    			append_dev(div9, button3);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[9]),
    				listen_dev(input1, "input", input1_input_handler),
    				listen_dev(input3, "input", input3_input_handler),
    				listen_dev(
    					form,
    					"submit",
    					prevent_default(function () {
    						if (is_function(/*addToCart*/ ctx[3](/*input_data*/ ctx[1].product_name))) /*addToCart*/ ctx[3](/*input_data*/ ctx[1].product_name).apply(this, arguments);
    					}),
    					false,
    					true,
    					false
    				),
    				listen_dev(button1, "click", /*click_handler_2*/ ctx[14], false, false, false),
    				listen_dev(button2, "click", /*click_handler_3*/ ctx[15], false, false, false),
    				listen_dev(button3, "click", /*click_handler_4*/ ctx[16], false, false, false)
    			];
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (dirty & /*purchaseDetail*/ 4 && t1_value !== (t1_value = /*purchaseDetail*/ ctx[2].purchase_id + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*input_data*/ 2 && input0.value !== /*input_data*/ ctx[1].product_name) {
    				set_input_value(input0, /*input_data*/ ctx[1].product_name);
    			}

    			if (!input1_updating && dirty & /*input_data*/ 2) {
    				set_input_value(input1, /*input_data*/ ctx[1].product_price);
    			}

    			input1_updating = false;

    			if (dirty & /*input_data*/ 2 && input2_value_value !== (input2_value_value = formatRupiah$4(/*input_data*/ ctx[1].product_price, "Rp")) && input2.value !== input2_value_value) {
    				prop_dev(input2, "value", input2_value_value);
    			}

    			if (!input3_updating && dirty & /*input_data*/ 2) {
    				set_input_value(input3, /*input_data*/ ctx[1].product_qty);
    			}

    			input3_updating = false;

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(tbody, null);
    				}
    			}

    			if (dirty & /*purchaseDetail*/ 4 && t32_value !== (t32_value = formatRupiah$4(/*purchaseDetail*/ ctx[2].purchase_total, "Rp. ") + "")) set_data_dev(t32, t32_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div14);

    			if (if_block) {
    				if_block.d();
    			}

    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function formatRupiah$4(angka, prefix) {
    	if (angka != undefined) {
    		angka = angka.toString();
    		var number_string = angka.replace(/[^,\d]/g, "").toString();
    		var split = number_string.split(",");
    		var sisa = split[0].length % 3;
    		var rupiah = split[0].substr(0, sisa);
    		var ribuan = split[0].substr(sisa).match(/\d{3}/gi);
    		var separator;

    		// tambahkan titik jika yang di input sudah menjadi angka ribuan
    		if (ribuan) {
    			separator = sisa ? "." : "";
    			rupiah += separator + ribuan.join(".");
    		}

    		rupiah = split[1] != undefined ? rupiah + "," + split[1] : rupiah;

    		return prefix == undefined
    		? rupiah
    		: rupiah ? "Rp. " + rupiah : "";
    	}

    	return "Rp. 0";
    }

    function generateNewPurchaseId$1() {
    	var randVal = 101 + Math.random() * (999 - 101);
    	return "180-" + Date.now() + "" + Math.round(randVal);
    }

    function goBack$1() {
    	window.history.back();
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { id } = $$props;
    	let cart = [];

    	let input_data = {
    		product_name: "",
    		product_price: "",
    		product_qty: ""
    	};

    	let purchaseDetail = {
    		purchase_id: "180",
    		purchase_total: 0,
    		purchase_status: 0,
    		purchase_date: 0,
    		purchase_items: []
    	};

    	// on mount
    	onMount(async () => {
    		if (id != "pembelian-baru") {
    			fetch("http://127.0.0.1/lumeraAPI/pos_purchase/getAllInventaris.php?purchase_id=" + id, { method: "GET" }).then(res => res.json()).then(data => {
    				$$invalidate(2, purchaseDetail.purchase_id = data.purchase_id, purchaseDetail);
    				$$invalidate(2, purchaseDetail.purchase_status = data.purchase_status, purchaseDetail);
    				$$invalidate(2, purchaseDetail.purchase_total = data.purchase_total, purchaseDetail);
    				$$invalidate(2, purchaseDetail.purchase_date = data.purchase_date, purchaseDetail);
    				$$invalidate(2, purchaseDetail.purchase_items = data.cart, purchaseDetail);
    				$$invalidate(0, cart = data.cart);
    			}).catch(err => {
    				
    			});
    		} else {
    			$$invalidate(2, purchaseDetail.purchase_id = generateNewPurchaseId$1(), purchaseDetail);
    		}
    	});

    	// add item to cart
    	function addToCart(product_name) {
    		let i = 0;
    		let alreadyOnCart = false;

    		for (i; i < cart.length; i++) {
    			// only add the qty, if the same item already listed in cart
    			if (product_name.toLowerCase() == cart[i].product_name.toLowerCase()) {
    				alreadyOnCart = true;
    				$$invalidate(0, cart[i].product_qty += input_data.product_qty, cart);
    				clearInput();
    			}
    		}

    		// add new item to the cart if the same item didn't exist yet
    		if (alreadyOnCart == false) {
    			$$invalidate(0, cart = [
    				...cart,
    				{
    					product_name: input_data.product_name,
    					product_price: input_data.product_price,
    					product_qty: input_data.product_qty
    				}
    			]);

    			clearInput();
    		}
    	}

    	function clearInput() {
    		$$invalidate(1, input_data.product_name = "", input_data);
    		$$invalidate(1, input_data.product_price = "", input_data);
    		$$invalidate(1, input_data.product_qty = "", input_data);
    	}

    	// select item
    	function selectItem(i) {
    		$$invalidate(1, input_data.product_name = cart[i].product_name, input_data);
    		$$invalidate(1, input_data.product_price = cart[i].product_price, input_data);
    		$$invalidate(1, input_data.product_qty = cart[i].product_qty, input_data);
    	}

    	// remove item
    	function removeItem(i) {
    		cart.splice(i, 1);
    		$$invalidate(0, cart);
    	}

    	function checkoutToApi(statusChooser) {
    		// if status is 0 it means only save
    		// if status is 1 it means checkout
    		let status = 0;

    		if (statusChooser == "checkout") {
    			status = 1;
    		}

    		if (cart.length == 0) {
    			alert("Keranjang checkout tidak boleh kosong");
    		} else {
    			let confirm_changes;

    			if (status == 0) {
    				confirm_changes = confirm("Anda yakin akan menyimpan pembelian ini?\n* Data masih bisa dirubah");
    			} else {
    				confirm_changes = confirm("Anda yakin akan menyimpan pembelian ini?\n* Dengan melakukan checkout data sudah tidak bisa dirubah lagi");
    			}

    			if (confirm_changes == true) {
    				// fill the object 
    				$$invalidate(2, purchaseDetail.purchase_items = cart, purchaseDetail);

    				$$invalidate(2, purchaseDetail.purchase_status = status, purchaseDetail);

    				fetch("http://127.0.0.1/lumeraAPI/pos_purchase/saveInventory.php", {
    					method: "POST",
    					body: JSON.stringify(purchaseDetail),
    					headers: {
    						"Content-Type": "application/x-www-form-urlencoded"
    					}
    				}).then(
    					function (response) {
    						response.status; //=> number 100–599
    						response.statusText; //=> String
    						response.headers; //=> Headers
    						response.url; //=> String
    						alert("Data berhasil disimpan");
    						goBack$1();
    						console.log(response);
    					},
    					function (error) {
    						error.message; //=> String
    					}
    				);
    			}
    		}
    	}

    	const writable_props = ["id"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$4.warn(`<PembelianInventaris> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PembelianInventaris", $$slots, []);

    	function input0_input_handler() {
    		input_data.product_name = this.value;
    		$$invalidate(1, input_data);
    	}

    	function input1_input_handler() {
    		input_data.product_price = to_number(this.value);
    		$$invalidate(1, input_data);
    	}

    	function input3_input_handler() {
    		input_data.product_qty = to_number(this.value);
    		$$invalidate(1, input_data);
    	}

    	const click_handler = i => removeItem(i);
    	const click_handler_1 = i => selectItem(i);
    	const click_handler_2 = () => checkoutToApi("checkout");
    	const click_handler_3 = () => checkoutToApi("save");
    	const click_handler_4 = () => goBack$1();

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(7, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		id,
    		cart,
    		input_data,
    		purchaseDetail,
    		formatRupiah: formatRupiah$4,
    		addToCart,
    		clearInput,
    		selectItem,
    		removeItem,
    		generateNewPurchaseId: generateNewPurchaseId$1,
    		goBack: goBack$1,
    		checkoutToApi
    	});

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(7, id = $$props.id);
    		if ("cart" in $$props) $$invalidate(0, cart = $$props.cart);
    		if ("input_data" in $$props) $$invalidate(1, input_data = $$props.input_data);
    		if ("purchaseDetail" in $$props) $$invalidate(2, purchaseDetail = $$props.purchaseDetail);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*cart, purchaseDetail*/ 5) {
    			 {
    				let i;
    				$$invalidate(2, purchaseDetail.purchase_total = 0, purchaseDetail);

    				for (i = 0; i < cart.length; i++) {
    					$$invalidate(2, purchaseDetail.purchase_total += cart[i].product_price * cart[i].product_qty, purchaseDetail);
    				}
    			}
    		}
    	};

    	return [
    		cart,
    		input_data,
    		purchaseDetail,
    		addToCart,
    		selectItem,
    		removeItem,
    		checkoutToApi,
    		id,
    		clearInput,
    		input0_input_handler,
    		input1_input_handler,
    		input3_input_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class PembelianInventaris extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { id: 7 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PembelianInventaris",
    			options,
    			id: create_fragment$i.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[7] === undefined && !("id" in props)) {
    			console_1$4.warn("<PembelianInventaris> was created without expected prop 'id'");
    		}
    	}

    	get id() {
    		throw new Error("<PembelianInventaris>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<PembelianInventaris>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\TablePembelianProdukKecantikan.svelte generated by Svelte v3.19.2 */
    const file$c = "src\\Pages\\TablePembelianProdukKecantikan.svelte";

    // (49:40) <Link to = "dashboard">
    function create_default_slot$7(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Dashboard");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(49:40) <Link to = \\\"dashboard\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let div4;
    	let section;
    	let div3;
    	let div2;
    	let div0;
    	let h1;
    	let t0;
    	let div1;
    	let ol;
    	let li0;
    	let t1;
    	let li1;
    	let t3;
    	let current;

    	const link = new Link({
    			props: {
    				to: "dashboard",
    				$$slots: { default: [create_default_slot$7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tableviewer = new TableViewer({
    			props: {
    				action: "purchase",
    				controller: /*controller*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			section = element("section");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = space();
    			div1 = element("div");
    			ol = element("ol");
    			li0 = element("li");
    			create_component(link.$$.fragment);
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "Pembelian Produk Kecantikan";
    			t3 = space();
    			create_component(tableviewer.$$.fragment);
    			add_location(h1, file$c, 44, 10, 1285);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$c, 43, 8, 1251);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$c, 48, 12, 1406);
    			attr_dev(li1, "class", "breadcrumb-item active");
    			add_location(li1, file$c, 49, 12, 1492);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$c, 47, 10, 1354);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$c, 46, 8, 1320);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$c, 42, 6, 1219);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$c, 41, 4, 1182);
    			attr_dev(section, "class", "content-header");
    			add_location(section, file$c, 40, 2, 1144);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$c, 38, 0, 1076);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, section);
    			append_dev(section, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, ol);
    			append_dev(ol, li0);
    			mount_component(link, li0, null);
    			append_dev(ol, t1);
    			append_dev(ol, li1);
    			append_dev(div4, t3);
    			mount_component(tableviewer, div4, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			transition_in(tableviewer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			transition_out(tableviewer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(link);
    			destroy_component(tableviewer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let { apiBaseUrl = "http://127.0.0.1/lumeraAPI" } = $$props;

    	let controller = {
    		name: "beli-produkkecantikan",
    		title: "Pembelian Produk Kecantikan",
    		sub_title: "Kelola pembelian produk",
    		icon: "fas fa-spa",
    		search_selector: 1,
    		button: {
    			text: "Pembelian Baru",
    			icon: "fa fa-plus",
    			link: "pembelian-baru"
    		},
    		table_header: ["#", "No. Invoice", "Total", "Status", "Tipe", "Tanggal Pembelian", "Aksi"],
    		apiUrl: apiBaseUrl + "/pos_purchase/getAllproductPurchase.php"
    	};

    	const writable_props = ["apiBaseUrl"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TablePembelianProdukKecantikan> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TablePembelianProdukKecantikan", $$slots, []);

    	$$self.$set = $$props => {
    		if ("apiBaseUrl" in $$props) $$invalidate(1, apiBaseUrl = $$props.apiBaseUrl);
    	};

    	$$self.$capture_state = () => ({
    		apiBaseUrl,
    		Router,
    		Link,
    		Route,
    		onMount,
    		TableViewer,
    		controller
    	});

    	$$self.$inject_state = $$props => {
    		if ("apiBaseUrl" in $$props) $$invalidate(1, apiBaseUrl = $$props.apiBaseUrl);
    		if ("controller" in $$props) $$invalidate(0, controller = $$props.controller);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [controller, apiBaseUrl];
    }

    class TablePembelianProdukKecantikan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, { apiBaseUrl: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TablePembelianProdukKecantikan",
    			options,
    			id: create_fragment$j.name
    		});
    	}

    	get apiBaseUrl() {
    		throw new Error("<TablePembelianProdukKecantikan>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set apiBaseUrl(value) {
    		throw new Error("<TablePembelianProdukKecantikan>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\TablePembelianInventaris.svelte generated by Svelte v3.19.2 */
    const file$d = "src\\Pages\\TablePembelianInventaris.svelte";

    // (49:40) <Link to = "dashboard">
    function create_default_slot$8(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Dashboard");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$8.name,
    		type: "slot",
    		source: "(49:40) <Link to = \\\"dashboard\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let div4;
    	let section;
    	let div3;
    	let div2;
    	let div0;
    	let h1;
    	let t0;
    	let div1;
    	let ol;
    	let li0;
    	let t1;
    	let li1;
    	let t3;
    	let current;

    	const link = new Link({
    			props: {
    				to: "dashboard",
    				$$slots: { default: [create_default_slot$8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tableviewer = new TableViewer({
    			props: {
    				action: "purchase",
    				controller: /*controller*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			section = element("section");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = space();
    			div1 = element("div");
    			ol = element("ol");
    			li0 = element("li");
    			create_component(link.$$.fragment);
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "Pembelian Produk Inventaris";
    			t3 = space();
    			create_component(tableviewer.$$.fragment);
    			add_location(h1, file$d, 44, 10, 1273);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$d, 43, 8, 1239);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$d, 48, 12, 1394);
    			attr_dev(li1, "class", "breadcrumb-item active");
    			add_location(li1, file$d, 49, 12, 1480);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$d, 47, 10, 1342);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$d, 46, 8, 1308);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$d, 42, 6, 1207);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$d, 41, 4, 1170);
    			attr_dev(section, "class", "content-header");
    			add_location(section, file$d, 40, 2, 1132);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$d, 38, 0, 1064);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, section);
    			append_dev(section, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, ol);
    			append_dev(ol, li0);
    			mount_component(link, li0, null);
    			append_dev(ol, t1);
    			append_dev(ol, li1);
    			append_dev(div4, t3);
    			mount_component(tableviewer, div4, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			transition_in(tableviewer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			transition_out(tableviewer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(link);
    			destroy_component(tableviewer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let { apiBaseUrl = "http://127.0.0.1/lumeraAPI" } = $$props;

    	let controller = {
    		name: "beli-inventaris",
    		title: "Pembelian Produk Inventaris",
    		sub_title: "Kelola pembelian Inventaris",
    		icon: "fa fa-cubes",
    		search_selector: 1,
    		button: {
    			text: "Pembelian Baru",
    			icon: "fa fa-plus",
    			link: "pembelian-baru"
    		},
    		table_header: ["#", "No. Invoice", "Total", "Status", "Tipe", "Tanggal Pembelian", "Aksi"],
    		apiUrl: apiBaseUrl + "/pos_purchase/getAllInventaris.php"
    	};

    	const writable_props = ["apiBaseUrl"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TablePembelianInventaris> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TablePembelianInventaris", $$slots, []);

    	$$self.$set = $$props => {
    		if ("apiBaseUrl" in $$props) $$invalidate(1, apiBaseUrl = $$props.apiBaseUrl);
    	};

    	$$self.$capture_state = () => ({
    		apiBaseUrl,
    		Router,
    		Link,
    		Route,
    		onMount,
    		TableViewer,
    		controller
    	});

    	$$self.$inject_state = $$props => {
    		if ("apiBaseUrl" in $$props) $$invalidate(1, apiBaseUrl = $$props.apiBaseUrl);
    		if ("controller" in $$props) $$invalidate(0, controller = $$props.controller);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [controller, apiBaseUrl];
    }

    class TablePembelianInventaris extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, { apiBaseUrl: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TablePembelianInventaris",
    			options,
    			id: create_fragment$k.name
    		});
    	}

    	get apiBaseUrl() {
    		throw new Error("<TablePembelianInventaris>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set apiBaseUrl(value) {
    		throw new Error("<TablePembelianInventaris>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Component\Modal.svelte generated by Svelte v3.19.2 */

    const file$e = "src\\Component\\Modal.svelte";

    function create_fragment$l(ctx) {
    	let div0;
    	let t0;
    	let div2;
    	let div1;
    	let h3;
    	let t1;
    	let small;
    	let t3;
    	let p;
    	let t5;
    	let select;
    	let option0;
    	let option1;
    	let t8;
    	let button;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			h3 = element("h3");
    			t1 = text("Cat Rambut\r\n\t\t  ");
    			small = element("small");
    			small.textContent = "With faded secondary text";
    			t3 = space();
    			p = element("p");
    			p.textContent = "Piih Stylish";
    			t5 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Pilih Stylish";
    			option1 = element("option");
    			option1.textContent = "Ma Dong Chan";
    			t8 = space();
    			button = element("button");
    			button.textContent = "Tambahkan";
    			attr_dev(div0, "id", "modal-bg");
    			attr_dev(div0, "class", "svelte-7nlw2n");
    			add_location(div0, file$e, 37, 0, 500);
    			attr_dev(small, "class", "text-muted");
    			add_location(small, file$e, 42, 4, 591);
    			add_location(h3, file$e, 40, 2, 565);
    			add_location(p, file$e, 44, 2, 663);
    			option0.disabled = "true";
    			option0.selected = true;
    			option0.__value = "Pilih Stylish";
    			option0.value = option0.__value;
    			add_location(option0, file$e, 46, 3, 720);
    			option1.__value = "Ma Dong Chan";
    			option1.value = option1.__value;
    			add_location(option1, file$e, 47, 3, 778);
    			attr_dev(select, "class", "form-control");
    			add_location(select, file$e, 45, 2, 686);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "btn btn-primary w-100 mt-3");
    			add_location(button, file$e, 49, 2, 824);
    			attr_dev(div1, "class", "svelte-7nlw2n");
    			add_location(div1, file$e, 39, 1, 556);
    			attr_dev(div2, "id", "modal-container");
    			attr_dev(div2, "class", "svelte-7nlw2n");
    			add_location(div2, file$e, 38, 0, 527);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, h3);
    			append_dev(h3, t1);
    			append_dev(h3, small);
    			append_dev(div1, t3);
    			append_dev(div1, p);
    			append_dev(div1, t5);
    			append_dev(div1, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(div1, t8);
    			append_dev(div1, button);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Modal", $$slots, []);
    	return [];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    /* src\Functions\CurrencyFormatting.svelte generated by Svelte v3.19.2 */

    function formatRupiah$5(angka, prefix) {
    	if (angka != undefined) {
    		angka = angka.toString();
    		var number_string = angka.replace(/[^,\d]/g, "").toString();
    		var split = number_string.split(",");
    		var sisa = split[0].length % 3;
    		var rupiah = split[0].substr(0, sisa);
    		var ribuan = split[0].substr(sisa).match(/\d{3}/gi);
    		var separator;

    		// tambahkan titik jika yang di input sudah menjadi angka ribuan
    		if (ribuan) {
    			separator = sisa ? "." : "";
    			rupiah += separator + ribuan.join(".");
    		}

    		rupiah = split[1] != undefined ? rupiah + "," + split[1] : rupiah;

    		return prefix == undefined
    		? rupiah
    		: rupiah ? "Rp. " + rupiah : "";
    	}

    	return "Rp. 0";
    }

    /* src\Functions\HttpModule.svelte generated by Svelte v3.19.2 */

    function HttpExecutor(api, method) {
    	return fetch(api, { method: "GET" }).then(res => res.json()).then(data => {
    		return data;
    	}).catch(err => {
    		return err;
    	});
    }

    /* src\Component\Cart.svelte generated by Svelte v3.19.2 */

    const file$f = "src\\Component\\Cart.svelte";

    function create_fragment$m(ctx) {
    	let div;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Cart";
    			add_location(p, file$f, 6, 1, 53);
    			add_location(div, file$f, 5, 0, 45);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Cart> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Cart", $$slots, []);
    	return [];
    }

    class Cart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cart",
    			options,
    			id: create_fragment$m.name
    		});
    	}
    }

    /* src\Pages\Kasir.svelte generated by Svelte v3.19.2 */

    const { console: console_1$5 } = globals;
    const file$g = "src\\Pages\\Kasir.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    function get_each_context_1$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (136:4) {#each topNav as nav}
    function create_each_block_1$4(ctx) {
    	let p;
    	let t_value = /*nav*/ ctx[9].nav_data + "";
    	let t;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[4](/*nav*/ ctx[9], ...args);
    	}

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "svelte-1x11p2q");
    			toggle_class(p, "active", /*nav*/ ctx[9].nav_class === "active");
    			add_location(p, file$g, 136, 5, 2674);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    			dispose = listen_dev(p, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*topNav*/ 2 && t_value !== (t_value = /*nav*/ ctx[9].nav_data + "")) set_data_dev(t, t_value);

    			if (dirty & /*topNav*/ 2) {
    				toggle_class(p, "active", /*nav*/ ctx[9].nav_class === "active");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$4.name,
    		type: "each",
    		source: "(136:4) {#each topNav as nav}",
    		ctx
    	});

    	return block;
    }

    // (152:5) {#if product[2].data != "Klinik"}
    function create_if_block$6(ctx) {
    	let div1;
    	let div0;
    	let p0;
    	let t0_value = /*product*/ ctx[6][1].data + "";
    	let t0;
    	let t1;
    	let p1;
    	let t2_value = formatRupiah$5(/*product*/ ctx[6][2].data, "Rp. ") + "";
    	let t2;
    	let t3;
    	let t4;
    	let button;
    	let i;
    	let t5;
    	let t6;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[5](/*i*/ ctx[8], ...args);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(t2_value);
    			t3 = text("/pcs");
    			t4 = space();
    			button = element("button");
    			i = element("i");
    			t5 = text("TAMBAHKAN");
    			t6 = space();
    			attr_dev(p0, "class", "mb-1");
    			set_style(p0, "font-size", "1.0rem");
    			add_location(p0, file$g, 154, 8, 3492);
    			attr_dev(p1, "class", "mb-2");
    			set_style(p1, "font-weight", "bold");
    			set_style(p1, "font-size", "0.8rem");
    			add_location(p1, file$g, 155, 8, 3564);
    			attr_dev(i, "class", "fa fa-plus p-2 bg-success ");
    			add_location(i, file$g, 156, 75, 3747);
    			attr_dev(button, "class", "btn btn-success btn-sm");
    			add_location(button, file$g, 156, 8, 3680);
    			attr_dev(div0, "class", "card p-3");
    			add_location(div0, file$g, 153, 7, 3460);
    			attr_dev(div1, "class", "col-lg-4");
    			add_location(div1, file$g, 152, 6, 3428);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, p1);
    			append_dev(p1, t2);
    			append_dev(p1, t3);
    			append_dev(div0, t4);
    			append_dev(div0, button);
    			append_dev(button, i);
    			append_dev(button, t5);
    			append_dev(div1, t6);
    			dispose = listen_dev(button, "click", click_handler_1, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*data_bind*/ 1 && t0_value !== (t0_value = /*product*/ ctx[6][1].data + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*data_bind*/ 1 && t2_value !== (t2_value = formatRupiah$5(/*product*/ ctx[6][2].data, "Rp. ") + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(152:5) {#if product[2].data != \\\"Klinik\\\"}",
    		ctx
    	});

    	return block;
    }

    // (151:4) {#each data_bind as product, i}
    function create_each_block$6(ctx) {
    	let if_block_anchor;
    	let if_block = /*product*/ ctx[6][2].data != "Klinik" && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*product*/ ctx[6][2].data != "Klinik") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$6(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(151:4) {#each data_bind as product, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$n(ctx) {
    	let t0;
    	let div7;
    	let span0;
    	let t3;
    	let span1;
    	let t5;
    	let div6;
    	let div4;
    	let div2;
    	let t6;
    	let div1;
    	let input;
    	let t7;
    	let div0;
    	let span2;
    	let i;
    	let t8;
    	let div3;
    	let t9;
    	let div5;
    	let current;
    	const modal = new Modal({ $$inline: true });
    	let each_value_1 = /*topNav*/ ctx[1];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$4(get_each_context_1$4(ctx, each_value_1, i));
    	}

    	let each_value = /*data_bind*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	const cart = new Cart({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(modal.$$.fragment);
    			t0 = space();
    			div7 = element("div");
    			span0 = element("span");
    			span0.textContent = `ID TRANSAKSI #${/*transactionDetail*/ ctx[2].id}`;
    			t3 = space();
    			span1 = element("span");
    			span1.textContent = "TRANSAKSI BARU";
    			t5 = space();
    			div6 = element("div");
    			div4 = element("div");
    			div2 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t6 = space();
    			div1 = element("div");
    			input = element("input");
    			t7 = space();
    			div0 = element("div");
    			span2 = element("span");
    			i = element("i");
    			t8 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t9 = space();
    			div5 = element("div");
    			create_component(cart.$$.fragment);
    			attr_dev(span0, "class", "badge badge-pill badge-primary mb-2");
    			add_location(span0, file$g, 126, 1, 2388);
    			attr_dev(span1, "class", "badge badge-pill badge-success");
    			add_location(span1, file$g, 127, 1, 2484);
    			set_style(input, "background", "none");
    			set_style(input, "border", "none");
    			set_style(input, "border-bottom", "1px solid black");
    			set_style(input, "border-radius", "0px");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "placeholder", "Cari disini..");
    			attr_dev(input, "type", "text");
    			add_location(input, file$g, 141, 11, 2900);
    			set_style(i, "cursor", "pointer");
    			set_style(i, "border", "none");
    			set_style(i, "background", "none");
    			attr_dev(i, "class", "fa fa-search");
    			add_location(i, file$g, 143, 44, 3180);
    			attr_dev(span2, "class", "input-group-text");
    			add_location(span2, file$g, 143, 13, 3149);
    			attr_dev(div0, "class", "input-group-append");
    			set_style(div0, "border", "none");
    			set_style(div0, "background", "none");
    			add_location(div0, file$g, 142, 11, 3066);
    			attr_dev(div1, "class", "input-group");
    			set_style(div1, "width", "200px");
    			set_style(div1, "position", "absolute");
    			set_style(div1, "right", "0");
    			set_style(div1, "top", "0");
    			add_location(div1, file$g, 140, 4, 2810);
    			attr_dev(div2, "class", "flex topnav svelte-1x11p2q");
    			add_location(div2, file$g, 133, 3, 2609);
    			attr_dev(div3, "class", "row mt-4");
    			add_location(div3, file$g, 149, 3, 3321);
    			attr_dev(div4, "class", "col-lg-8");
    			add_location(div4, file$g, 131, 2, 2580);
    			attr_dev(div5, "class", "col-lg-4");
    			add_location(div5, file$g, 165, 2, 3890);
    			attr_dev(div6, "class", "row");
    			add_location(div6, file$g, 129, 1, 2555);
    			attr_dev(div7, "class", "container mt-5");
    			add_location(div7, file$g, 124, 0, 2355);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, span0);
    			append_dev(div7, t3);
    			append_dev(div7, span1);
    			append_dev(div7, t5);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div4, div2);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div2, null);
    			}

    			append_dev(div2, t6);
    			append_dev(div2, div1);
    			append_dev(div1, input);
    			append_dev(div1, t7);
    			append_dev(div1, div0);
    			append_dev(div0, span2);
    			append_dev(span2, i);
    			append_dev(div4, t8);
    			append_dev(div4, div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			append_dev(div6, t9);
    			append_dev(div6, div5);
    			mount_component(cart, div5, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*topNav, changeNav*/ 10) {
    				each_value_1 = /*topNav*/ ctx[1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$4(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$4(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div2, t6);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*addToCart, formatRupiah, data_bind*/ 1) {
    				each_value = /*data_bind*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div3, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			transition_in(cart.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			transition_out(cart.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div7);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			destroy_component(cart);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
    	let data_bind = [];

    	/*
    Transaction detail variable and element
     */
    	let transactionDetail = { id: "" };

    	let topNav = [
    		{
    			nav_id: "1",
    			nav_data: "Layanan Kecantikan",
    			nav_class: "active"
    		},
    		{
    			nav_id: "2",
    			nav_data: "Produk Kecantikan",
    			nav_class: ""
    		}
    	];

    	onMount(async () => {
    		HttpExecutor("http://127.0.0.1/lumeraAPI/master_data/getAllSaloonServices.php").then(data => {
    			$$invalidate(0, data_bind = data);
    			console.log(data_bind);
    			console.log(data_bind[1][1].data);
    		}).catch(err => {
    			
    		});
    	});

    	function changeNav(nav) {
    		for (var i = 0; i < topNav.length; i++) {
    			if (topNav[i].nav_id == nav) {
    				$$invalidate(1, topNav[i].nav_class = "active", topNav);

    				if (topNav[i].nav_id == "1") {
    					HttpExecutor("http://127.0.0.1/lumeraAPI/master_data/getAllSaloonServices.php").then(data => {
    						$$invalidate(0, data_bind = data);
    						console.log(data_bind);
    						console.log(data_bind[1][1].data);
    					}).catch(err => {
    						
    					});
    				} else if (topNav[i].nav_id == "2") {
    					HttpExecutor("http://127.0.0.1/lumeraAPI/master_data/getAllSaloonServices.php").then(data => {
    						$$invalidate(0, data_bind = data);
    						console.log(data_bind);
    						console.log(data_bind[1][1].data);
    					}).catch(err => {
    						
    					});
    				}
    			} else {
    				$$invalidate(1, topNav[i].nav_class = "", topNav);
    			}
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$5.warn(`<Kasir> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Kasir", $$slots, []);
    	const click_handler = nav => changeNav(nav.nav_id);
    	const click_handler_1 = i => addToCart(i);

    	$$self.$capture_state = () => ({
    		onMount,
    		Modal,
    		formatRupiah: formatRupiah$5,
    		HttpExecutor,
    		Cart,
    		data_bind,
    		transactionDetail,
    		topNav,
    		changeNav
    	});

    	$$self.$inject_state = $$props => {
    		if ("data_bind" in $$props) $$invalidate(0, data_bind = $$props.data_bind);
    		if ("transactionDetail" in $$props) $$invalidate(2, transactionDetail = $$props.transactionDetail);
    		if ("topNav" in $$props) $$invalidate(1, topNav = $$props.topNav);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		data_bind,
    		topNav,
    		transactionDetail,
    		changeNav,
    		click_handler,
    		click_handler_1
    	];
    }

    class Kasir extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Kasir",
    			options,
    			id: create_fragment$n.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.19.2 */
    const file$h = "src\\App.svelte";

    // (57:5) <Route path="/layanan/edit/:id" let:params>
    function create_default_slot_7(ctx) {
    	let current;

    	const tambahlayanan = new TambahLayanan({
    			props: { id: /*params*/ ctx[2].id },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tambahlayanan.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tambahlayanan, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tambahlayanan_changes = {};
    			if (dirty & /*params*/ 4) tambahlayanan_changes.id = /*params*/ ctx[2].id;
    			tambahlayanan.$set(tambahlayanan_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tambahlayanan.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tambahlayanan.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tambahlayanan, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(57:5) <Route path=\\\"/layanan/edit/:id\\\" let:params>",
    		ctx
    	});

    	return block;
    }

    // (64:5) <Route path="/staf/edit/:id" let:params>
    function create_default_slot_6(ctx) {
    	let current;

    	const tambahstaf = new TambahStaf({
    			props: { id: /*params*/ ctx[2].id },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tambahstaf.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tambahstaf, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tambahstaf_changes = {};
    			if (dirty & /*params*/ 4) tambahstaf_changes.id = /*params*/ ctx[2].id;
    			tambahstaf.$set(tambahstaf_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tambahstaf.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tambahstaf.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tambahstaf, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(64:5) <Route path=\\\"/staf/edit/:id\\\" let:params>",
    		ctx
    	});

    	return block;
    }

    // (71:5) <Route path="/produkkecantikan/edit/:id" let:params>
    function create_default_slot_5(ctx) {
    	let current;

    	const tambahprodukkecantikan = new TambahProdukkecantikan({
    			props: { id: /*params*/ ctx[2].id },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tambahprodukkecantikan.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tambahprodukkecantikan, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tambahprodukkecantikan_changes = {};
    			if (dirty & /*params*/ 4) tambahprodukkecantikan_changes.id = /*params*/ ctx[2].id;
    			tambahprodukkecantikan.$set(tambahprodukkecantikan_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tambahprodukkecantikan.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tambahprodukkecantikan.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tambahprodukkecantikan, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(71:5) <Route path=\\\"/produkkecantikan/edit/:id\\\" let:params>",
    		ctx
    	});

    	return block;
    }

    // (78:5) <Route path="/pasien/edit/:id" let:params>
    function create_default_slot_4(ctx) {
    	let current;

    	const tambahpasien = new TambahPasien({
    			props: { id: /*params*/ ctx[2].id },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tambahpasien.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tambahpasien, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tambahpasien_changes = {};
    			if (dirty & /*params*/ 4) tambahpasien_changes.id = /*params*/ ctx[2].id;
    			tambahpasien.$set(tambahpasien_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tambahpasien.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tambahpasien.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tambahpasien, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(78:5) <Route path=\\\"/pasien/edit/:id\\\" let:params>",
    		ctx
    	});

    	return block;
    }

    // (83:2) <Route path="/beli-produkkecantikan/:id" let:params>
    function create_default_slot_3$1(ctx) {
    	let current;

    	const pembelianprodukkecantikan = new PembelianProdukKecantikan({
    			props: { id: /*params*/ ctx[2].id },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(pembelianprodukkecantikan.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(pembelianprodukkecantikan, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const pembelianprodukkecantikan_changes = {};
    			if (dirty & /*params*/ 4) pembelianprodukkecantikan_changes.id = /*params*/ ctx[2].id;
    			pembelianprodukkecantikan.$set(pembelianprodukkecantikan_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pembelianprodukkecantikan.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pembelianprodukkecantikan.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pembelianprodukkecantikan, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$1.name,
    		type: "slot",
    		source: "(83:2) <Route path=\\\"/beli-produkkecantikan/:id\\\" let:params>",
    		ctx
    	});

    	return block;
    }

    // (88:2) <Route path="/beli-inventaris/:id" let:params>
    function create_default_slot_2$1(ctx) {
    	let current;

    	const pembelianinventaris = new PembelianInventaris({
    			props: { id: /*params*/ ctx[2].id },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(pembelianinventaris.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(pembelianinventaris, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const pembelianinventaris_changes = {};
    			if (dirty & /*params*/ 4) pembelianinventaris_changes.id = /*params*/ ctx[2].id;
    			pembelianinventaris.$set(pembelianinventaris_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pembelianinventaris.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pembelianinventaris.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pembelianinventaris, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(88:2) <Route path=\\\"/beli-inventaris/:id\\\" let:params>",
    		ctx
    	});

    	return block;
    }

    // (93:2) <Route path="/kasir/:id" let:params>
    function create_default_slot_1$3(ctx) {
    	let current;

    	const kasir = new Kasir({
    			props: { id: /*params*/ ctx[2].id },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(kasir.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(kasir, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const kasir_changes = {};
    			if (dirty & /*params*/ 4) kasir_changes.id = /*params*/ ctx[2].id;
    			kasir.$set(kasir_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(kasir.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(kasir.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(kasir, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$3.name,
    		type: "slot",
    		source: "(93:2) <Route path=\\\"/kasir/:id\\\" let:params>",
    		ctx
    	});

    	return block;
    }

    // (45:0) <Router>
    function create_default_slot$9(ctx) {
    	let t0;
    	let div0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let t10;
    	let t11;
    	let t12;
    	let t13;
    	let t14;
    	let t15;
    	let t16;
    	let t17;
    	let t18;
    	let t19;
    	let footer;
    	let div1;
    	let b;
    	let t21;
    	let t22;
    	let strong;
    	let t23;
    	let a;
    	let t25;
    	let t26;
    	let current;
    	const sidebar = new Sidebar({ $$inline: true });
    	sidebar.$on("message", /*handleMessage*/ ctx[1]);

    	const route0 = new Route({
    			props: { path: "dashboard", component: Dashboard },
    			$$inline: true
    		});

    	const route1 = new Route({
    			props: { path: "/layanan", component: Layanan },
    			$$inline: true
    		});

    	const route2 = new Route({
    			props: {
    				path: "/layanan/tambah",
    				component: TambahLayanan
    			},
    			$$inline: true
    		});

    	const route3 = new Route({
    			props: {
    				path: "/layanan/edit/:id",
    				$$slots: {
    					default: [
    						create_default_slot_7,
    						({ params }) => ({ 2: params }),
    						({ params }) => params ? 4 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const route4 = new Route({
    			props: { path: "/staf", component: Staf },
    			$$inline: true
    		});

    	const route5 = new Route({
    			props: {
    				path: "/staf/tambah",
    				component: TambahStaf
    			},
    			$$inline: true
    		});

    	const route6 = new Route({
    			props: {
    				path: "/staf/edit/:id",
    				$$slots: {
    					default: [
    						create_default_slot_6,
    						({ params }) => ({ 2: params }),
    						({ params }) => params ? 4 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const route7 = new Route({
    			props: {
    				path: "/produkkecantikan",
    				component: Produkkecantikan
    			},
    			$$inline: true
    		});

    	const route8 = new Route({
    			props: {
    				path: "/produkkecantikan/tambah",
    				component: TambahProdukkecantikan
    			},
    			$$inline: true
    		});

    	const route9 = new Route({
    			props: {
    				path: "/produkkecantikan/edit/:id",
    				$$slots: {
    					default: [
    						create_default_slot_5,
    						({ params }) => ({ 2: params }),
    						({ params }) => params ? 4 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const route10 = new Route({
    			props: { path: "/pasien", component: Pasien },
    			$$inline: true
    		});

    	const route11 = new Route({
    			props: {
    				path: "/pasien/tambah",
    				component: TambahPasien
    			},
    			$$inline: true
    		});

    	const route12 = new Route({
    			props: {
    				path: "/pasien/edit/:id",
    				$$slots: {
    					default: [
    						create_default_slot_4,
    						({ params }) => ({ 2: params }),
    						({ params }) => params ? 4 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const route13 = new Route({
    			props: {
    				path: "/beli-produkkecantikan",
    				component: TablePembelianProdukKecantikan
    			},
    			$$inline: true
    		});

    	const route14 = new Route({
    			props: {
    				path: "/beli-produkkecantikan/:id",
    				$$slots: {
    					default: [
    						create_default_slot_3$1,
    						({ params }) => ({ 2: params }),
    						({ params }) => params ? 4 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const route15 = new Route({
    			props: {
    				path: "/beli-inventaris",
    				component: TablePembelianInventaris
    			},
    			$$inline: true
    		});

    	const route16 = new Route({
    			props: {
    				path: "/beli-inventaris/:id",
    				$$slots: {
    					default: [
    						create_default_slot_2$1,
    						({ params }) => ({ 2: params }),
    						({ params }) => params ? 4 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const route17 = new Route({
    			props: { path: "/kasir", component: Kasir },
    			$$inline: true
    		});

    	const route18 = new Route({
    			props: {
    				path: "/kasir/:id",
    				$$slots: {
    					default: [
    						create_default_slot_1$3,
    						({ params }) => ({ 2: params }),
    						({ params }) => params ? 4 : 0
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(sidebar.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			create_component(route0.$$.fragment);
    			t1 = space();
    			create_component(route1.$$.fragment);
    			t2 = space();
    			create_component(route2.$$.fragment);
    			t3 = space();
    			create_component(route3.$$.fragment);
    			t4 = space();
    			create_component(route4.$$.fragment);
    			t5 = space();
    			create_component(route5.$$.fragment);
    			t6 = space();
    			create_component(route6.$$.fragment);
    			t7 = space();
    			create_component(route7.$$.fragment);
    			t8 = space();
    			create_component(route8.$$.fragment);
    			t9 = space();
    			create_component(route9.$$.fragment);
    			t10 = space();
    			create_component(route10.$$.fragment);
    			t11 = space();
    			create_component(route11.$$.fragment);
    			t12 = space();
    			create_component(route12.$$.fragment);
    			t13 = space();
    			create_component(route13.$$.fragment);
    			t14 = space();
    			create_component(route14.$$.fragment);
    			t15 = space();
    			create_component(route15.$$.fragment);
    			t16 = space();
    			create_component(route16.$$.fragment);
    			t17 = space();
    			create_component(route17.$$.fragment);
    			t18 = space();
    			create_component(route18.$$.fragment);
    			t19 = space();
    			footer = element("footer");
    			div1 = element("div");
    			b = element("b");
    			b.textContent = "Version";
    			t21 = text(" 1.0");
    			t22 = space();
    			strong = element("strong");
    			t23 = text("Copyright © 2020 ");
    			a = element("a");
    			a.textContent = "Lumera System";
    			t25 = text(".");
    			t26 = text(" All rights reserved.");
    			attr_dev(div0, "class", "content-wrapper svelte-1hjzir8");
    			set_style(div0, "margin-left", /*containerMarginVisibletoSidebar*/ ctx[0] + "px");
    			add_location(div0, file$h, 50, 3, 1711);
    			add_location(b, file$h, 101, 8, 3597);
    			attr_dev(div1, "class", "float-right d-none d-sm-block");
    			add_location(div1, file$h, 100, 5, 3544);
    			attr_dev(a, "href", "#");
    			add_location(a, file$h, 103, 35, 3665);
    			add_location(strong, file$h, 103, 5, 3635);
    			attr_dev(footer, "class", "main-footer svelte-1hjzir8");
    			set_style(footer, "margin-left", /*containerMarginVisibletoSidebar*/ ctx[0] + "px");
    			add_location(footer, file$h, 99, 3, 3451);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sidebar, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div0, anchor);
    			mount_component(route0, div0, null);
    			append_dev(div0, t1);
    			mount_component(route1, div0, null);
    			append_dev(div0, t2);
    			mount_component(route2, div0, null);
    			append_dev(div0, t3);
    			mount_component(route3, div0, null);
    			append_dev(div0, t4);
    			mount_component(route4, div0, null);
    			append_dev(div0, t5);
    			mount_component(route5, div0, null);
    			append_dev(div0, t6);
    			mount_component(route6, div0, null);
    			append_dev(div0, t7);
    			mount_component(route7, div0, null);
    			append_dev(div0, t8);
    			mount_component(route8, div0, null);
    			append_dev(div0, t9);
    			mount_component(route9, div0, null);
    			append_dev(div0, t10);
    			mount_component(route10, div0, null);
    			append_dev(div0, t11);
    			mount_component(route11, div0, null);
    			append_dev(div0, t12);
    			mount_component(route12, div0, null);
    			append_dev(div0, t13);
    			mount_component(route13, div0, null);
    			append_dev(div0, t14);
    			mount_component(route14, div0, null);
    			append_dev(div0, t15);
    			mount_component(route15, div0, null);
    			append_dev(div0, t16);
    			mount_component(route16, div0, null);
    			append_dev(div0, t17);
    			mount_component(route17, div0, null);
    			append_dev(div0, t18);
    			mount_component(route18, div0, null);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div1);
    			append_dev(div1, b);
    			append_dev(div1, t21);
    			append_dev(footer, t22);
    			append_dev(footer, strong);
    			append_dev(strong, t23);
    			append_dev(strong, a);
    			append_dev(strong, t25);
    			append_dev(footer, t26);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const route3_changes = {};

    			if (dirty & /*$$scope, params*/ 12) {
    				route3_changes.$$scope = { dirty, ctx };
    			}

    			route3.$set(route3_changes);
    			const route6_changes = {};

    			if (dirty & /*$$scope, params*/ 12) {
    				route6_changes.$$scope = { dirty, ctx };
    			}

    			route6.$set(route6_changes);
    			const route9_changes = {};

    			if (dirty & /*$$scope, params*/ 12) {
    				route9_changes.$$scope = { dirty, ctx };
    			}

    			route9.$set(route9_changes);
    			const route12_changes = {};

    			if (dirty & /*$$scope, params*/ 12) {
    				route12_changes.$$scope = { dirty, ctx };
    			}

    			route12.$set(route12_changes);
    			const route14_changes = {};

    			if (dirty & /*$$scope, params*/ 12) {
    				route14_changes.$$scope = { dirty, ctx };
    			}

    			route14.$set(route14_changes);
    			const route16_changes = {};

    			if (dirty & /*$$scope, params*/ 12) {
    				route16_changes.$$scope = { dirty, ctx };
    			}

    			route16.$set(route16_changes);
    			const route18_changes = {};

    			if (dirty & /*$$scope, params*/ 12) {
    				route18_changes.$$scope = { dirty, ctx };
    			}

    			route18.$set(route18_changes);

    			if (!current || dirty & /*containerMarginVisibletoSidebar*/ 1) {
    				set_style(div0, "margin-left", /*containerMarginVisibletoSidebar*/ ctx[0] + "px");
    			}

    			if (!current || dirty & /*containerMarginVisibletoSidebar*/ 1) {
    				set_style(footer, "margin-left", /*containerMarginVisibletoSidebar*/ ctx[0] + "px");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);
    			transition_in(route0.$$.fragment, local);
    			transition_in(route1.$$.fragment, local);
    			transition_in(route2.$$.fragment, local);
    			transition_in(route3.$$.fragment, local);
    			transition_in(route4.$$.fragment, local);
    			transition_in(route5.$$.fragment, local);
    			transition_in(route6.$$.fragment, local);
    			transition_in(route7.$$.fragment, local);
    			transition_in(route8.$$.fragment, local);
    			transition_in(route9.$$.fragment, local);
    			transition_in(route10.$$.fragment, local);
    			transition_in(route11.$$.fragment, local);
    			transition_in(route12.$$.fragment, local);
    			transition_in(route13.$$.fragment, local);
    			transition_in(route14.$$.fragment, local);
    			transition_in(route15.$$.fragment, local);
    			transition_in(route16.$$.fragment, local);
    			transition_in(route17.$$.fragment, local);
    			transition_in(route18.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			transition_out(route0.$$.fragment, local);
    			transition_out(route1.$$.fragment, local);
    			transition_out(route2.$$.fragment, local);
    			transition_out(route3.$$.fragment, local);
    			transition_out(route4.$$.fragment, local);
    			transition_out(route5.$$.fragment, local);
    			transition_out(route6.$$.fragment, local);
    			transition_out(route7.$$.fragment, local);
    			transition_out(route8.$$.fragment, local);
    			transition_out(route9.$$.fragment, local);
    			transition_out(route10.$$.fragment, local);
    			transition_out(route11.$$.fragment, local);
    			transition_out(route12.$$.fragment, local);
    			transition_out(route13.$$.fragment, local);
    			transition_out(route14.$$.fragment, local);
    			transition_out(route15.$$.fragment, local);
    			transition_out(route16.$$.fragment, local);
    			transition_out(route17.$$.fragment, local);
    			transition_out(route18.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sidebar, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div0);
    			destroy_component(route0);
    			destroy_component(route1);
    			destroy_component(route2);
    			destroy_component(route3);
    			destroy_component(route4);
    			destroy_component(route5);
    			destroy_component(route6);
    			destroy_component(route7);
    			destroy_component(route8);
    			destroy_component(route9);
    			destroy_component(route10);
    			destroy_component(route11);
    			destroy_component(route12);
    			destroy_component(route13);
    			destroy_component(route14);
    			destroy_component(route15);
    			destroy_component(route16);
    			destroy_component(route17);
    			destroy_component(route18);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$9.name,
    		type: "slot",
    		source: "(45:0) <Router>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$o(ctx) {
    	let current;

    	const router = new Router({
    			props: {
    				$$slots: { default: [create_default_slot$9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const router_changes = {};

    			if (dirty & /*$$scope, containerMarginVisibletoSidebar*/ 9) {
    				router_changes.$$scope = { dirty, ctx };
    			}

    			router.$set(router_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	let containerMarginVisibletoSidebar = 250;

    	function handleMessage(event) {
    		$$invalidate(0, containerMarginVisibletoSidebar = event.detail.text);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		Sidebar,
    		Staf,
    		TambahStaf,
    		ProdukKecantikan: Produkkecantikan,
    		TambahProdukKecantikan: TambahProdukkecantikan,
    		Layanan,
    		TambahLayanan,
    		Pasien,
    		TambahPasien,
    		Dashboard,
    		PembelianProdukKecantikan,
    		PembelianInventaris,
    		TabelPembelianProdukKecantikan: TablePembelianProdukKecantikan,
    		TabelPembelianInventaris: TablePembelianInventaris,
    		Kasir,
    		Modal,
    		Router,
    		Link,
    		Route,
    		containerMarginVisibletoSidebar,
    		handleMessage
    	});

    	$$self.$inject_state = $$props => {
    		if ("containerMarginVisibletoSidebar" in $$props) $$invalidate(0, containerMarginVisibletoSidebar = $$props.containerMarginVisibletoSidebar);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [containerMarginVisibletoSidebar, handleMessage];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$o.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
