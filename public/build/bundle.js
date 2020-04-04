
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

    /* src/layout/Navbar.svelte generated by Svelte v3.19.2 */

    const file = "src/layout/Navbar.svelte";

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
    			add_location(i0, file, 13, 74, 280);
    			attr_dev(a0, "class", "nav-link");
    			attr_dev(a0, "data-widget", "pushmenu");
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "role", "button");
    			add_location(a0, file, 13, 8, 214);
    			attr_dev(li0, "class", "nav-item");
    			add_location(li0, file, 12, 6, 184);
    			attr_dev(ul0, "class", "navbar-nav");
    			add_location(ul0, file, 11, 4, 154);
    			attr_dev(i1, "class", "fas fa-cogs");
    			add_location(i1, file, 19, 99, 529);
    			attr_dev(a1, "class", "nav-link");
    			attr_dev(a1, "data-widget", "control-sidebar");
    			attr_dev(a1, "data-slide", "true");
    			attr_dev(a1, "href", "#");
    			attr_dev(a1, "role", "button");
    			add_location(a1, file, 19, 8, 438);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file, 18, 6, 408);
    			attr_dev(ul1, "class", "navbar-nav ml-auto");
    			add_location(ul1, file, 17, 4, 370);
    			attr_dev(nav, "class", "main-header navbar navbar-expand navbar-dark");
    			add_location(nav, file, 9, 2, 60);
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

    /* node_modules/svelte-routing/src/Router.svelte generated by Svelte v3.19.2 */

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

    /* node_modules/svelte-routing/src/Route.svelte generated by Svelte v3.19.2 */

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

    /* node_modules/svelte-routing/src/Link.svelte generated by Svelte v3.19.2 */
    const file$1 = "node_modules/svelte-routing/src/Link.svelte";

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

    /* src/layout/Sidebar.svelte generated by Svelte v3.19.2 */
    const file$2 = "src/layout/Sidebar.svelte";

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

    // (227:10) {#if nav_item.nav_child.length > 0}
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
    			add_location(i, file$2, 229, 16, 6164);
    			attr_dev(p, "class", "mt-0 col-10");
    			add_location(p, file$2, 230, 16, 6241);
    			attr_dev(div0, "class", "row text-white position-relative");
    			add_location(div0, file$2, 228, 14, 6101);
    			attr_dev(div1, "class", "nav-argon-item mt-2 svelte-j1xut8");
    			add_location(div1, file$2, 227, 12, 6011);
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
    		source: "(227:10) {#if nav_item.nav_child.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (232:16) {#if nav_item.nav_child.length > 0}
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
    			add_location(i, file$2, 232, 18, 6358);
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
    		source: "(232:16) {#if nav_item.nav_child.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (237:12) {#if nav_item.nav_show_child == true}
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

    			add_location(div, file$2, 237, 14, 6584);
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
    		source: "(237:12) {#if nav_item.nav_show_child == true}",
    		ctx
    	});

    	return block;
    }

    // (240:18) <Link to="{nav_child.nav_to}">
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
    			add_location(i, file$2, 241, 22, 6893);
    			attr_dev(p, "class", "mt-0 col-10");
    			add_location(p, file$2, 242, 22, 6977);
    			attr_dev(div, "class", "nav-argon-item row text-white position-relative ml-1 svelte-j1xut8");
    			add_location(div, file$2, 240, 20, 6762);
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
    		source: "(240:18) <Link to=\\\"{nav_child.nav_to}\\\">",
    		ctx
    	});

    	return block;
    }

    // (239:16) {#each nav_item.nav_child as nav_child}
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
    		source: "(239:16) {#each nav_item.nav_child as nav_child}",
    		ctx
    	});

    	return block;
    }

    // (251:10) {#if nav_item.nav_child.length == 0}
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
    		source: "(251:10) {#if nav_item.nav_child.length == 0}",
    		ctx
    	});

    	return block;
    }

    // (257:18) {#if nav_item.nav_child.length > 0}
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
    			add_location(i, file$2, 257, 20, 7590);
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
    		source: "(257:18) {#if nav_item.nav_child.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (252:12) <Link to="{nav_item.nav_to}">
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
    			add_location(i, file$2, 254, 18, 7390);
    			attr_dev(p, "class", "mt-0 col-10");
    			add_location(p, file$2, 255, 18, 7469);
    			attr_dev(div0, "class", "row text-white position-relative");
    			add_location(div0, file$2, 253, 16, 7325);
    			attr_dev(div1, "class", "nav-argon-item mt-2 svelte-j1xut8");
    			add_location(div1, file$2, 252, 14, 7275);
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
    		source: "(252:12) <Link to=\\\"{nav_item.nav_to}\\\">",
    		ctx
    	});

    	return block;
    }

    // (225:8) {#each navbar_item as nav_item}
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
    		source: "(225:8) {#each navbar_item as nav_item}",
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
    			add_location(img0, file$2, 197, 10, 4861);
    			attr_dev(div0, "class", "col-4");
    			add_location(div0, file$2, 196, 8, 4831);
    			attr_dev(p0, "class", "brand-text-1 mb-1 font-weight-light svelte-j1xut8");
    			add_location(p0, file$2, 200, 10, 5010);
    			attr_dev(p1, "class", "brand-text-2 mt-0 font-weight-bold svelte-j1xut8");
    			add_location(p1, file$2, 201, 10, 5081);
    			attr_dev(div1, "class", "col-6 mt-3 ml-2");
    			add_location(div1, file$2, 199, 8, 4970);
    			attr_dev(div2, "class", "row w-100");
    			add_location(div2, file$2, 195, 6, 4799);
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "class", "brand-link");
    			add_location(a0, file$2, 194, 4, 4761);
    			attr_dev(img1, "alt", "Image placeholder");
    			if (img1.src !== (img1_src_value = "./assets/img/profile_picture/avatar_1.jpg")) attr_dev(img1, "src", img1_src_value);
    			add_location(img1, file$2, 212, 14, 5473);
    			attr_dev(a1, "href", "javascript:;");
    			attr_dev(a1, "class", "avatar rounded-circle");
    			add_location(a1, file$2, 211, 10, 5405);
    			attr_dev(p2, "class", "user-authorization-name m-0 mb-1 svelte-j1xut8");
    			add_location(p2, file$2, 215, 12, 5626);
    			attr_dev(p3, "class", "user-authorization-status svelte-j1xut8");
    			add_location(p3, file$2, 216, 12, 5696);
    			attr_dev(div3, "class", "user-authorization-info svelte-j1xut8");
    			add_location(div3, file$2, 214, 10, 5576);
    			attr_dev(div4, "class", "user-panel mt-1 ml-0 d-flex elevation-2 pt-3 pl-3 pb-1 svelte-j1xut8");
    			add_location(div4, file$2, 209, 6, 5288);
    			attr_dev(hr, "class", "mt-3 mb-4");
    			add_location(hr, file$2, 220, 6, 5788);
    			attr_dev(nav0, "class", "mt-3 container");
    			add_location(nav0, file$2, 223, 6, 5848);
    			attr_dev(div5, "class", "sidebar");
    			add_location(div5, file$2, 207, 4, 5215);
    			attr_dev(div6, "class", "text-white");
    			set_style(div6, "margin", "7px");
    			add_location(div6, file$2, 191, 2, 4682);
    			attr_dev(aside, "class", "main-sidebar bg-primary elevation-4 sidebar-anim svelte-j1xut8");
    			set_style(aside, "position", "fixed");
    			set_style(aside, "height", "100vh");
    			set_style(aside, "transform", "translateX(" + /*sidebar_visible*/ ctx[1] + "px)");
    			set_style(aside, "overflow-y", "auto");
    			add_location(aside, file$2, 189, 0, 4513);
    			attr_dev(i0, "class", "fas fa-bars");
    			add_location(i0, file$2, 274, 80, 8238);
    			attr_dev(a2, "class", "nav-link text-primary");
    			attr_dev(a2, "role", "button");
    			add_location(a2, file$2, 274, 8, 8166);
    			attr_dev(li0, "class", "nav-item");
    			set_style(li0, "cursor", "pointer");
    			add_location(li0, file$2, 273, 6, 8111);
    			attr_dev(ul0, "class", "navbar-nav");
    			add_location(ul0, file$2, 272, 4, 8081);
    			attr_dev(i1, "class", "fas fa-cogs");
    			add_location(i1, file$2, 280, 99, 8487);
    			attr_dev(a3, "class", "nav-link");
    			attr_dev(a3, "data-widget", "control-sidebar");
    			attr_dev(a3, "data-slide", "true");
    			attr_dev(a3, "href", "#");
    			attr_dev(a3, "role", "button");
    			add_location(a3, file$2, 280, 8, 8396);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file$2, 279, 6, 8366);
    			attr_dev(ul1, "class", "navbar-nav ml-auto");
    			add_location(ul1, file$2, 278, 4, 8328);
    			attr_dev(nav1, "class", "main-header navbar navbar-expand");
    			set_style(nav1, "margin-left", /*navbar_margin*/ ctx[2] + "px");
    			set_style(nav1, "transition", "all 0.5s linear");
    			set_style(nav1, "padding", "0px 0px 18px 0px ");
    			set_style(nav1, "height", "auto");
    			set_style(nav1, "background-color", "#fff");
    			add_location(nav1, file$2, 270, 2, 7871);
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
    					nav_icon: "fa fa-cube",
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
    					nav_icon: "far fa-circle",
    					nav_to: "produkkecantikan"
    				},
    				{
    					nav_body: "Jasa",
    					nav_icon: "far fa-circle",
    					nav_to: "jasa"
    				}
    			]
    		},
    		{
    			nav_id: 3,
    			nav_body: "Penjualan",
    			nav_icon: "fas fa-fax",
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

    /* src/Component/TableViewer.svelte generated by Svelte v3.19.2 */

    const { console: console_1 } = globals;
    const file$3 = "src/Component/TableViewer.svelte";

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (119:18) <Link to="{controller.button.link}">
    function create_default_slot$1(ctx) {
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
    			add_location(i, file$3, 120, 22, 3483);
    			attr_dev(button, "class", "btn btn-primary btn-round btn-md");
    			add_location(button, file$3, 119, 20, 3411);
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
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(119:18) <Link to=\\\"{controller.button.link}\\\">",
    		ctx
    	});

    	return block;
    }

    // (130:22) {#each controller.table_header as table_title}
    function create_each_block_2(ctx) {
    	let th;
    	let t_value = /*table_title*/ ctx[11] + "";
    	let t;

    	const block = {
    		c: function create() {
    			th = element("th");
    			t = text(t_value);
    			add_location(th, file$3, 130, 24, 3869);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			append_dev(th, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*controller*/ 1 && t_value !== (t_value = /*table_title*/ ctx[11] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(130:22) {#each controller.table_header as table_title}",
    		ctx
    	});

    	return block;
    }

    // (143:26) {:else}
    function create_else_block$1(ctx) {
    	let td;
    	let t_value = /*child_data*/ ctx[8].data + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			add_location(td, file$3, 143, 28, 4539);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data_bind*/ 2 && t_value !== (t_value = /*child_data*/ ctx[8].data + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(143:26) {:else}",
    		ctx
    	});

    	return block;
    }

    // (141:63) 
    function create_if_block_1$2(ctx) {
    	let td;
    	let span;
    	let t_value = /*child_data*/ ctx[8].data + "";
    	let t;
    	let span_class_value;

    	const block = {
    		c: function create() {
    			td = element("td");
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", span_class_value = "" + (null_to_empty(/*child_data*/ ctx[8].class) + " svelte-1v56gq8"));
    			set_style(span, "font-size", "16px");
    			add_location(span, file$3, 141, 32, 4390);
    			add_location(td, file$3, 141, 28, 4386);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, span);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data_bind*/ 2 && t_value !== (t_value = /*child_data*/ ctx[8].data + "")) set_data_dev(t, t_value);

    			if (dirty & /*data_bind*/ 2 && span_class_value !== (span_class_value = "" + (null_to_empty(/*child_data*/ ctx[8].class) + " svelte-1v56gq8"))) {
    				attr_dev(span, "class", span_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(141:63) ",
    		ctx
    	});

    	return block;
    }

    // (139:26) {#if child_data.type == "price"}
    function create_if_block$2(ctx) {
    	let td;
    	let t0;
    	let t1_value = formatRupiah(/*child_data*/ ctx[8].data) + "";
    	let t1;
    	let td_class_value;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t0 = text("Rp. ");
    			t1 = text(t1_value);
    			attr_dev(td, "class", td_class_value = "" + (null_to_empty(/*child_data*/ ctx[8].class) + " svelte-1v56gq8"));
    			add_location(td, file$3, 139, 28, 4222);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t0);
    			append_dev(td, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data_bind*/ 2 && t1_value !== (t1_value = formatRupiah(/*child_data*/ ctx[8].data) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*data_bind*/ 2 && td_class_value !== (td_class_value = "" + (null_to_empty(/*child_data*/ ctx[8].class) + " svelte-1v56gq8"))) {
    				attr_dev(td, "class", td_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(139:26) {#if child_data.type == \\\"price\\\"}",
    		ctx
    	});

    	return block;
    }

    // (138:24) {#each parent_data as child_data}
    function create_each_block_1$1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*child_data*/ ctx[8].type == "price") return create_if_block$2;
    		if (/*child_data*/ ctx[8].type == "badge") return create_if_block_1$2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(138:24) {#each parent_data as child_data}",
    		ctx
    	});

    	return block;
    }

    // (136:20) {#each data_bind as parent_data}
    function create_each_block$1(ctx) {
    	let tr;
    	let t0;
    	let td;
    	let button0;
    	let i0;
    	let t1;
    	let button1;
    	let i1;
    	let t2;
    	let each_value_1 = /*parent_data*/ ctx[5];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			td = element("td");
    			button0 = element("button");
    			i0 = element("i");
    			t1 = space();
    			button1 = element("button");
    			i1 = element("i");
    			t2 = space();
    			attr_dev(i0, "class", "fa fa-pencil-ruler pt-1");
    			add_location(i0, file$3, 148, 28, 4839);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "rel", "tooltip");
    			attr_dev(button0, "class", "btn btn-info btn-icon btn-sm ");
    			attr_dev(button0, "data-original-title", "");
    			attr_dev(button0, "title", "");
    			add_location(button0, file$3, 147, 26, 4704);
    			attr_dev(i1, "class", "fa fa-trash pt-1");
    			add_location(i1, file$3, 150, 134, 5049);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "rel", "tooltip");
    			attr_dev(button1, "class", "btn btn-danger btn-icon btn-sm ");
    			attr_dev(button1, "data-original-title", "");
    			attr_dev(button1, "title", "");
    			add_location(button1, file$3, 150, 26, 4941);
    			attr_dev(td, "class", "td-actions");
    			add_location(td, file$3, 146, 24, 4654);
    			add_location(tr, file$3, 136, 22, 4072);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t0);
    			append_dev(tr, td);
    			append_dev(td, button0);
    			append_dev(button0, i0);
    			append_dev(td, t1);
    			append_dev(td, button1);
    			append_dev(button1, i1);
    			append_dev(tr, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data_bind, formatRupiah*/ 2) {
    				each_value_1 = /*parent_data*/ ctx[5];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t0);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(136:20) {#each data_bind as parent_data}",
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
    	let current;
    	let dispose;

    	const link = new Link({
    			props: {
    				to: /*controller*/ ctx[0].button.link,
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let each_value_2 = /*controller*/ ctx[0].table_header;
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value = /*data_bind*/ ctx[1];
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

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t8 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(i0, "class", i0_class_value = "" + (/*controller*/ ctx[0].icon + " mr-3 mt-3" + " svelte-1v56gq8"));
    			add_location(i0, file$3, 103, 18, 2592);
    			attr_dev(h5, "class", "mb-0");
    			add_location(h5, file$3, 105, 20, 2680);
    			attr_dev(p, "class", "mt-1");
    			add_location(p, file$3, 106, 20, 2741);
    			add_location(div0, file$3, 104, 18, 2654);
    			attr_dev(div1, "class", "page-heading svelte-1v56gq8");
    			add_location(div1, file$3, 102, 16, 2547);
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "placeholder", "Cari disini..");
    			attr_dev(input, "type", "text");
    			add_location(input, file$3, 112, 22, 2992);
    			set_style(i1, "cursor", "pointer");
    			attr_dev(i1, "class", "fa fa-search");
    			add_location(i1, file$3, 114, 55, 3194);
    			attr_dev(span, "class", "input-group-text");
    			add_location(span, file$3, 114, 24, 3163);
    			attr_dev(div2, "class", "input-group-append");
    			add_location(div2, file$3, 113, 22, 3106);
    			attr_dev(div3, "class", "input-group");
    			add_location(div3, file$3, 111, 20, 2944);
    			attr_dev(div4, "class", "form-group mr-2");
    			add_location(div4, file$3, 110, 18, 2894);
    			attr_dev(div5, "class", "heading-tools svelte-1v56gq8");
    			add_location(div5, file$3, 109, 16, 2848);
    			attr_dev(div6, "class", "card-header");
    			add_location(div6, file$3, 101, 14, 2505);
    			add_location(tr, file$3, 128, 20, 3771);
    			add_location(thead, file$3, 127, 16, 3743);
    			add_location(tbody, file$3, 134, 16, 3989);
    			attr_dev(table, "class", "table");
    			add_location(table, file$3, 126, 14, 3705);
    			attr_dev(div7, "class", "card card-primary card-outline");
    			add_location(div7, file$3, 100, 12, 2446);
    			attr_dev(div8, "class", "col-md-12");
    			add_location(div8, file$3, 99, 10, 2410);
    			attr_dev(div9, "class", "row");
    			add_location(div9, file$3, 98, 8, 2382);
    			attr_dev(div10, "class", "container-fluid");
    			add_location(div10, file$3, 97, 6, 2344);
    			attr_dev(section, "class", "content");
    			add_location(section, file$3, 96, 4, 2312);
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
    			set_input_value(input, /*searchBox*/ ctx[2]);
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

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(tr, null);
    			}

    			append_dev(table, t8);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;
    			dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[4]);
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*controller*/ 1 && i0_class_value !== (i0_class_value = "" + (/*controller*/ ctx[0].icon + " mr-3 mt-3" + " svelte-1v56gq8"))) {
    				attr_dev(i0, "class", i0_class_value);
    			}

    			if ((!current || dirty & /*controller*/ 1) && t1_value !== (t1_value = /*controller*/ ctx[0].title + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*controller*/ 1) && t3_value !== (t3_value = /*controller*/ ctx[0].sub_title + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*searchBox*/ 4 && input.value !== /*searchBox*/ ctx[2]) {
    				set_input_value(input, /*searchBox*/ ctx[2]);
    			}

    			const link_changes = {};
    			if (dirty & /*controller*/ 1) link_changes.to = /*controller*/ ctx[0].button.link;

    			if (dirty & /*$$scope, controller*/ 16385) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);

    			if (dirty & /*controller*/ 1) {
    				each_value_2 = /*controller*/ ctx[0].table_header;
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(tr, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty & /*data_bind, formatRupiah*/ 2) {
    				each_value = /*data_bind*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
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
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(link);
    			destroy_each(each_blocks_1, detaching);
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

    function instance$5($$self, $$props, $$invalidate) {
    	let { controller } = $$props;
    	let data_bind = [];
    	let data_raw = [];
    	let searchBox = "";

    	// on mount
    	onMount(async () => {
    		fetch(controller.apiUrl, { method: "GET" }).then(res => res.json()).then(data => {
    			$$invalidate(3, data_raw = data);
    			console.log(data_raw);
    		}).catch(err => {
    			
    		});
    	});

    	const writable_props = ["controller"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<TableViewer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TableViewer", $$slots, []);

    	function input_input_handler() {
    		searchBox = this.value;
    		$$invalidate(2, searchBox);
    	}

    	$$self.$set = $$props => {
    		if ("controller" in $$props) $$invalidate(0, controller = $$props.controller);
    	};

    	$$self.$capture_state = () => ({
    		controller,
    		Router,
    		Link,
    		Route,
    		onMount,
    		data_bind,
    		data_raw,
    		searchBox,
    		formatRupiah
    	});

    	$$self.$inject_state = $$props => {
    		if ("controller" in $$props) $$invalidate(0, controller = $$props.controller);
    		if ("data_bind" in $$props) $$invalidate(1, data_bind = $$props.data_bind);
    		if ("data_raw" in $$props) $$invalidate(3, data_raw = $$props.data_raw);
    		if ("searchBox" in $$props) $$invalidate(2, searchBox = $$props.searchBox);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*searchBox, data_raw, controller*/ 13) {
    			// search controller
    			 {
    				if (searchBox != "" && data_raw != []) {
    					$$invalidate(1, data_bind = []);
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
    								$$invalidate(1, data_bind[counter] = data_raw[j], data_bind);
    							}
    						}
    					}

    					console.log("Found " + counter + " matchs");
    				} else if (searchBox == "" && data_raw != []) {
    					$$invalidate(1, data_bind = data_raw);
    				}
    			}
    		}
    	};

    	return [controller, data_bind, searchBox, data_raw, input_input_handler];
    }

    class TableViewer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { controller: 0 });

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
    }

    /* src/Pages/Staf.svelte generated by Svelte v3.19.2 */
    const file$4 = "src/Pages/Staf.svelte";

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
    			add_location(h1, file$4, 44, 10, 1127);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$4, 43, 8, 1094);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$4, 48, 12, 1244);
    			attr_dev(li1, "class", "breadcrumb-item active");
    			add_location(li1, file$4, 49, 12, 1329);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$4, 47, 10, 1193);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$4, 46, 8, 1160);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$4, 42, 6, 1063);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$4, 41, 4, 1027);
    			attr_dev(section, "class", "content-header");
    			add_location(section, file$4, 40, 2, 990);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$4, 38, 0, 924);
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
    		title: "Daftar Staf",
    		sub_title: "Kelola staf disini",
    		icon: "fa fa-users",
    		search_selector: 1,
    		button: {
    			text: "Tambah Staf",
    			icon: "fa fa-plus",
    			link: "tambahstaf"
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

    /* src/Pages/TambahStaf.svelte generated by Svelte v3.19.2 */
    const file$5 = "src/Pages/TambahStaf.svelte";

    // (19:40) <Link to = "dashboard">
    function create_default_slot_2(ctx) {
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
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(19:40) <Link to = \\\"dashboard\\\">",
    		ctx
    	});

    	return block;
    }

    // (20:40) <Link to = "staf">
    function create_default_slot_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Staf");
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
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(20:40) <Link to = \\\"staf\\\">",
    		ctx
    	});

    	return block;
    }

    // (83:18) <Link to="staf">
    function create_default_slot$3(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "BATAL";
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-danger");
    			add_location(button, file$5, 82, 34, 3571);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(83:18) <Link to=\\\"staf\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div18;
    	let section0;
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
    	let t2;
    	let li2;
    	let t4;
    	let section1;
    	let div17;
    	let div16;
    	let div15;
    	let div14;
    	let div4;
    	let h5;
    	let i;
    	let t5;
    	let t6;
    	let form;
    	let div12;
    	let div5;
    	let label0;
    	let t8;
    	let input0;
    	let t9;
    	let div6;
    	let label1;
    	let t11;
    	let input1;
    	let t12;
    	let div7;
    	let label2;
    	let t14;
    	let input2;
    	let t15;
    	let div8;
    	let label3;
    	let t17;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let option5;
    	let t24;
    	let div11;
    	let label4;
    	let t26;
    	let div9;
    	let input3;
    	let t27;
    	let label5;
    	let t29;
    	let div10;
    	let input4;
    	let t30;
    	let label6;
    	let t32;
    	let div13;
    	let button;
    	let t34;
    	let current;

    	const link0 = new Link({
    			props: {
    				to: "dashboard",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const link1 = new Link({
    			props: {
    				to: "staf",
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const link2 = new Link({
    			props: {
    				to: "staf",
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div18 = element("div");
    			section0 = element("section");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = space();
    			div1 = element("div");
    			ol = element("ol");
    			li0 = element("li");
    			create_component(link0.$$.fragment);
    			t1 = space();
    			li1 = element("li");
    			create_component(link1.$$.fragment);
    			t2 = space();
    			li2 = element("li");
    			li2.textContent = "Tambah Staf";
    			t4 = space();
    			section1 = element("section");
    			div17 = element("div");
    			div16 = element("div");
    			div15 = element("div");
    			div14 = element("div");
    			div4 = element("div");
    			h5 = element("h5");
    			i = element("i");
    			t5 = text("Tambah Staf");
    			t6 = space();
    			form = element("form");
    			div12 = element("div");
    			div5 = element("div");
    			label0 = element("label");
    			label0.textContent = "Nama Lengkap";
    			t8 = space();
    			input0 = element("input");
    			t9 = space();
    			div6 = element("div");
    			label1 = element("label");
    			label1.textContent = "Username";
    			t11 = space();
    			input1 = element("input");
    			t12 = space();
    			div7 = element("div");
    			label2 = element("label");
    			label2.textContent = "Password";
    			t14 = space();
    			input2 = element("input");
    			t15 = space();
    			div8 = element("div");
    			label3 = element("label");
    			label3.textContent = "Posisi";
    			t17 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "-PILIH-";
    			option1 = element("option");
    			option1.textContent = "Administrator";
    			option2 = element("option");
    			option2.textContent = "Kasir";
    			option3 = element("option");
    			option3.textContent = "Bautician";
    			option4 = element("option");
    			option4.textContent = "Stylist";
    			option5 = element("option");
    			option5.textContent = "Hair washer";
    			t24 = space();
    			div11 = element("div");
    			label4 = element("label");
    			label4.textContent = "Status";
    			t26 = space();
    			div9 = element("div");
    			input3 = element("input");
    			t27 = space();
    			label5 = element("label");
    			label5.textContent = "Aktif";
    			t29 = space();
    			div10 = element("div");
    			input4 = element("input");
    			t30 = space();
    			label6 = element("label");
    			label6.textContent = "Tidak Aktif";
    			t32 = space();
    			div13 = element("div");
    			button = element("button");
    			button.textContent = "TAMBAHKAN STAF";
    			t34 = space();
    			create_component(link2.$$.fragment);
    			add_location(h1, file$5, 14, 10, 406);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$5, 13, 8, 373);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$5, 18, 12, 523);
    			attr_dev(li1, "class", "breadcrumb-item");
    			add_location(li1, file$5, 19, 12, 608);
    			attr_dev(li2, "class", "breadcrumb-item active");
    			add_location(li2, file$5, 20, 12, 683);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$5, 17, 10, 472);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$5, 16, 8, 439);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$5, 12, 6, 342);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$5, 11, 4, 306);
    			attr_dev(section0, "class", "content-header");
    			add_location(section0, file$5, 10, 2, 269);
    			attr_dev(i, "class", "fas fa-user-plus mr-2");
    			add_location(i, file$5, 36, 36, 1145);
    			attr_dev(h5, "class", "mt-1 mb-0");
    			add_location(h5, file$5, 36, 14, 1123);
    			attr_dev(div4, "class", "card-header");
    			add_location(div4, file$5, 35, 12, 1083);
    			attr_dev(label0, "for", "namaLengkap important-form");
    			add_location(label0, file$5, 43, 20, 1425);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "namaLengkap");
    			attr_dev(input0, "placeholder", "Masukkan Nama Lengkap");
    			add_location(input0, file$5, 44, 20, 1506);
    			attr_dev(div5, "class", "form-group");
    			add_location(div5, file$5, 42, 18, 1380);
    			attr_dev(label1, "for", "username");
    			add_location(label1, file$5, 47, 20, 1688);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "id", "username");
    			attr_dev(input1, "placeholder", "Masukkan Username");
    			add_location(input1, file$5, 48, 20, 1747);
    			attr_dev(div6, "class", "form-group");
    			add_location(div6, file$5, 46, 18, 1643);
    			attr_dev(label2, "for", "password");
    			add_location(label2, file$5, 51, 20, 1922);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "id", "password");
    			attr_dev(input2, "placeholder", "Masukkan Password");
    			add_location(input2, file$5, 52, 20, 1981);
    			attr_dev(div7, "class", "form-group");
    			add_location(div7, file$5, 50, 18, 1877);
    			add_location(label3, file$5, 55, 20, 2156);
    			option0.__value = "-PILIH-";
    			option0.value = option0.__value;
    			add_location(option0, file$5, 57, 22, 2250);
    			option1.__value = "Administrator";
    			option1.value = option1.__value;
    			add_location(option1, file$5, 58, 22, 2297);
    			option2.__value = "Kasir";
    			option2.value = option2.__value;
    			add_location(option2, file$5, 59, 22, 2350);
    			option3.__value = "Bautician";
    			option3.value = option3.__value;
    			add_location(option3, file$5, 60, 22, 2395);
    			option4.__value = "Stylist";
    			option4.value = option4.__value;
    			add_location(option4, file$5, 61, 22, 2444);
    			option5.__value = "Hair washer";
    			option5.value = option5.__value;
    			add_location(option5, file$5, 62, 22, 2491);
    			attr_dev(select, "class", "form-control");
    			add_location(select, file$5, 56, 20, 2198);
    			attr_dev(div8, "class", "form-group");
    			add_location(div8, file$5, 54, 18, 2111);
    			attr_dev(label4, "for", "status");
    			add_location(label4, file$5, 66, 20, 2639);
    			attr_dev(input3, "name", "radioStatus");
    			attr_dev(input3, "class", "custom-control-input");
    			attr_dev(input3, "id", "radioAktif");
    			input3.checked = "radioAktif";
    			attr_dev(input3, "type", "radio");
    			add_location(input3, file$5, 68, 22, 2763);
    			attr_dev(label5, "class", "custom-control-label");
    			attr_dev(label5, "for", "radioAktif");
    			add_location(label5, file$5, 69, 22, 2891);
    			attr_dev(div9, "class", "custom-control custom-radio mb-3");
    			add_location(div9, file$5, 67, 20, 2694);
    			attr_dev(input4, "name", "radioStatus");
    			attr_dev(input4, "class", "custom-control-input");
    			attr_dev(input4, "id", "radioTidakAktif");
    			input4.checked = "";
    			attr_dev(input4, "type", "radio");
    			add_location(input4, file$5, 72, 22, 3074);
    			attr_dev(label6, "class", "custom-control-label");
    			attr_dev(label6, "for", "radioTidakAktif");
    			add_location(label6, file$5, 73, 22, 3197);
    			attr_dev(div10, "class", "custom-control custom-radio mb-3");
    			add_location(div10, file$5, 71, 20, 3005);
    			attr_dev(div11, "class", "form-group");
    			add_location(div11, file$5, 65, 19, 2594);
    			attr_dev(div12, "class", "card-body");
    			add_location(div12, file$5, 41, 16, 1338);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$5, 81, 18, 3467);
    			attr_dev(div13, "class", "card-footer");
    			add_location(div13, file$5, 80, 16, 3423);
    			attr_dev(form, "role", "form");
    			add_location(form, file$5, 40, 14, 1303);
    			attr_dev(div14, "class", "card card-primary card-outline");
    			add_location(div14, file$5, 34, 10, 1026);
    			attr_dev(div15, "class", "col-md-12");
    			add_location(div15, file$5, 32, 8, 951);
    			attr_dev(div16, "class", "row");
    			add_location(div16, file$5, 30, 6, 896);
    			attr_dev(div17, "class", "container-fluid");
    			add_location(div17, file$5, 29, 4, 860);
    			attr_dev(section1, "class", "content");
    			add_location(section1, file$5, 28, 2, 830);
    			attr_dev(div18, "class", "container");
    			add_location(div18, file$5, 8, 0, 203);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div18, anchor);
    			append_dev(div18, section0);
    			append_dev(section0, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, ol);
    			append_dev(ol, li0);
    			mount_component(link0, li0, null);
    			append_dev(ol, t1);
    			append_dev(ol, li1);
    			mount_component(link1, li1, null);
    			append_dev(ol, t2);
    			append_dev(ol, li2);
    			append_dev(div18, t4);
    			append_dev(div18, section1);
    			append_dev(section1, div17);
    			append_dev(div17, div16);
    			append_dev(div16, div15);
    			append_dev(div15, div14);
    			append_dev(div14, div4);
    			append_dev(div4, h5);
    			append_dev(h5, i);
    			append_dev(h5, t5);
    			append_dev(div14, t6);
    			append_dev(div14, form);
    			append_dev(form, div12);
    			append_dev(div12, div5);
    			append_dev(div5, label0);
    			append_dev(div5, t8);
    			append_dev(div5, input0);
    			append_dev(div12, t9);
    			append_dev(div12, div6);
    			append_dev(div6, label1);
    			append_dev(div6, t11);
    			append_dev(div6, input1);
    			append_dev(div12, t12);
    			append_dev(div12, div7);
    			append_dev(div7, label2);
    			append_dev(div7, t14);
    			append_dev(div7, input2);
    			append_dev(div12, t15);
    			append_dev(div12, div8);
    			append_dev(div8, label3);
    			append_dev(div8, t17);
    			append_dev(div8, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			append_dev(select, option4);
    			append_dev(select, option5);
    			append_dev(div12, t24);
    			append_dev(div12, div11);
    			append_dev(div11, label4);
    			append_dev(div11, t26);
    			append_dev(div11, div9);
    			append_dev(div9, input3);
    			append_dev(div9, t27);
    			append_dev(div9, label5);
    			append_dev(div11, t29);
    			append_dev(div11, div10);
    			append_dev(div10, input4);
    			append_dev(div10, t30);
    			append_dev(div10, label6);
    			append_dev(form, t32);
    			append_dev(form, div13);
    			append_dev(div13, button);
    			append_dev(div13, t34);
    			mount_component(link2, div13, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link0_changes.$$scope = { dirty, ctx };
    			}

    			link0.$set(link0_changes);
    			const link1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link1_changes.$$scope = { dirty, ctx };
    			}

    			link1.$set(link1_changes);
    			const link2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link2_changes.$$scope = { dirty, ctx };
    			}

    			link2.$set(link2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link0.$$.fragment, local);
    			transition_in(link1.$$.fragment, local);
    			transition_in(link2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link0.$$.fragment, local);
    			transition_out(link1.$$.fragment, local);
    			transition_out(link2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div18);
    			destroy_component(link0);
    			destroy_component(link1);
    			destroy_component(link2);
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

    function instance$7($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TambahStaf> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TambahStaf", $$slots, []);
    	$$self.$capture_state = () => ({ Router, Link, Route });
    	return [];
    }

    class TambahStaf extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TambahStaf",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/Pages/Produkkecantikan.svelte generated by Svelte v3.19.2 */
    const file$6 = "src/Pages/Produkkecantikan.svelte";

    // (49:40) <Link to = "dashboard">
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
    		source: "(49:40) <Link to = \\\"dashboard\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
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
    			add_location(h1, file$6, 44, 10, 1198);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$6, 43, 8, 1165);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$6, 48, 12, 1315);
    			attr_dev(li1, "class", "breadcrumb-item active");
    			add_location(li1, file$6, 49, 12, 1400);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$6, 47, 10, 1264);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$6, 46, 8, 1231);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$6, 42, 6, 1134);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$6, 41, 4, 1098);
    			attr_dev(section, "class", "content-header");
    			add_location(section, file$6, 40, 2, 1061);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$6, 38, 0, 995);
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { apiBaseUrl = "http://127.0.0.1/lumeraAPI" } = $$props;

    	let controller = {
    		title: "Daftar Produk Kecantikan",
    		sub_title: "Kelola produk kecantikan disini",
    		icon: "fa fa-cubes",
    		search_selector: 2,
    		button: {
    			text: "Tambah Produk Kecantikan",
    			icon: "fa fa-plus",
    			link: "tambahprodukkecantikan"
    		},
    		table_header: ["#", "Barcode", "Nama Produk", "Harga", "Stok", "Aksi"],
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
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { apiBaseUrl: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Produkkecantikan",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get apiBaseUrl() {
    		throw new Error("<Produkkecantikan>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set apiBaseUrl(value) {
    		throw new Error("<Produkkecantikan>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Pages/TambahProdukkecantikan.svelte generated by Svelte v3.19.2 */
    const file$7 = "src/Pages/TambahProdukkecantikan.svelte";

    // (19:40) <Link to = "dashboard">
    function create_default_slot_2$1(ctx) {
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
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(19:40) <Link to = \\\"dashboard\\\">",
    		ctx
    	});

    	return block;
    }

    // (20:40) <Link to = "produkkecantikan">
    function create_default_slot_1$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Produk Kecantikan");
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
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(20:40) <Link to = \\\"produkkecantikan\\\">",
    		ctx
    	});

    	return block;
    }

    // (60:18) <Link to="produkkecantikan">
    function create_default_slot$5(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "BATAL";
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-danger");
    			add_location(button, file$7, 59, 46, 2414);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(60:18) <Link to=\\\"produkkecantikan\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div14;
    	let section0;
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
    	let t2;
    	let li2;
    	let t4;
    	let section1;
    	let div13;
    	let div12;
    	let div11;
    	let div10;
    	let div4;
    	let h5;
    	let i;
    	let t5;
    	let t6;
    	let form;
    	let div8;
    	let div5;
    	let label0;
    	let t8;
    	let input0;
    	let t9;
    	let div6;
    	let label1;
    	let t11;
    	let input1;
    	let t12;
    	let div7;
    	let label2;
    	let t14;
    	let input2;
    	let t15;
    	let div9;
    	let button;
    	let t17;
    	let current;

    	const link0 = new Link({
    			props: {
    				to: "dashboard",
    				$$slots: { default: [create_default_slot_2$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const link1 = new Link({
    			props: {
    				to: "produkkecantikan",
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const link2 = new Link({
    			props: {
    				to: "produkkecantikan",
    				$$slots: { default: [create_default_slot$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div14 = element("div");
    			section0 = element("section");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = space();
    			div1 = element("div");
    			ol = element("ol");
    			li0 = element("li");
    			create_component(link0.$$.fragment);
    			t1 = space();
    			li1 = element("li");
    			create_component(link1.$$.fragment);
    			t2 = space();
    			li2 = element("li");
    			li2.textContent = "Tambah Produk Kecantikan";
    			t4 = space();
    			section1 = element("section");
    			div13 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			div10 = element("div");
    			div4 = element("div");
    			h5 = element("h5");
    			i = element("i");
    			t5 = text("Tambah Produk Kecantikan");
    			t6 = space();
    			form = element("form");
    			div8 = element("div");
    			div5 = element("div");
    			label0 = element("label");
    			label0.textContent = "Barcode";
    			t8 = space();
    			input0 = element("input");
    			t9 = space();
    			div6 = element("div");
    			label1 = element("label");
    			label1.textContent = "Nama Produk Kecantikan";
    			t11 = space();
    			input1 = element("input");
    			t12 = space();
    			div7 = element("div");
    			label2 = element("label");
    			label2.textContent = "Harga";
    			t14 = space();
    			input2 = element("input");
    			t15 = space();
    			div9 = element("div");
    			button = element("button");
    			button.textContent = "TAMBAHKAN PRODUK KECANTIKAN";
    			t17 = space();
    			create_component(link2.$$.fragment);
    			add_location(h1, file$7, 14, 10, 418);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$7, 13, 8, 385);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$7, 18, 12, 535);
    			attr_dev(li1, "class", "breadcrumb-item");
    			add_location(li1, file$7, 19, 12, 620);
    			attr_dev(li2, "class", "breadcrumb-item active");
    			add_location(li2, file$7, 20, 12, 720);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$7, 17, 10, 484);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$7, 16, 8, 451);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$7, 12, 6, 354);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$7, 11, 4, 318);
    			attr_dev(section0, "class", "content-header");
    			add_location(section0, file$7, 10, 2, 281);
    			attr_dev(i, "class", "fas fa-plus-square mr-2");
    			add_location(i, file$7, 36, 36, 1195);
    			attr_dev(h5, "class", "mt-1 mb-0");
    			add_location(h5, file$7, 36, 14, 1173);
    			attr_dev(div4, "class", "card-header");
    			add_location(div4, file$7, 35, 12, 1133);
    			attr_dev(label0, "for", "barcode important-form");
    			add_location(label0, file$7, 43, 20, 1490);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "barcode");
    			attr_dev(input0, "placeholder", "Masukkan Barcode");
    			add_location(input0, file$7, 44, 20, 1562);
    			attr_dev(div5, "class", "form-group");
    			add_location(div5, file$7, 42, 18, 1445);
    			attr_dev(label1, "for", "product_name");
    			add_location(label1, file$7, 47, 20, 1735);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "id", "product_name");
    			attr_dev(input1, "placeholder", "Masukkan Nama Produk Kecantikan");
    			add_location(input1, file$7, 48, 20, 1812);
    			attr_dev(div6, "class", "form-group");
    			add_location(div6, file$7, 46, 18, 1690);
    			attr_dev(label2, "for", "harga");
    			add_location(label2, file$7, 51, 20, 2005);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "id", "harga");
    			attr_dev(input2, "placeholder", "Masukkan Harga");
    			add_location(input2, file$7, 52, 20, 2058);
    			attr_dev(div7, "class", "form-group");
    			add_location(div7, file$7, 50, 18, 1960);
    			attr_dev(div8, "class", "card-body");
    			add_location(div8, file$7, 41, 16, 1403);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$7, 58, 18, 2285);
    			attr_dev(div9, "class", "card-footer");
    			add_location(div9, file$7, 57, 16, 2241);
    			attr_dev(form, "role", "form");
    			add_location(form, file$7, 40, 14, 1368);
    			attr_dev(div10, "class", "card card-primary card-outline");
    			add_location(div10, file$7, 34, 10, 1076);
    			attr_dev(div11, "class", "col-md-12");
    			add_location(div11, file$7, 32, 8, 1001);
    			attr_dev(div12, "class", "row");
    			add_location(div12, file$7, 30, 6, 946);
    			attr_dev(div13, "class", "container-fluid");
    			add_location(div13, file$7, 29, 4, 910);
    			attr_dev(section1, "class", "content");
    			add_location(section1, file$7, 28, 2, 880);
    			attr_dev(div14, "class", "container");
    			add_location(div14, file$7, 8, 0, 215);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div14, anchor);
    			append_dev(div14, section0);
    			append_dev(section0, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, ol);
    			append_dev(ol, li0);
    			mount_component(link0, li0, null);
    			append_dev(ol, t1);
    			append_dev(ol, li1);
    			mount_component(link1, li1, null);
    			append_dev(ol, t2);
    			append_dev(ol, li2);
    			append_dev(div14, t4);
    			append_dev(div14, section1);
    			append_dev(section1, div13);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div10, div4);
    			append_dev(div4, h5);
    			append_dev(h5, i);
    			append_dev(h5, t5);
    			append_dev(div10, t6);
    			append_dev(div10, form);
    			append_dev(form, div8);
    			append_dev(div8, div5);
    			append_dev(div5, label0);
    			append_dev(div5, t8);
    			append_dev(div5, input0);
    			append_dev(div8, t9);
    			append_dev(div8, div6);
    			append_dev(div6, label1);
    			append_dev(div6, t11);
    			append_dev(div6, input1);
    			append_dev(div8, t12);
    			append_dev(div8, div7);
    			append_dev(div7, label2);
    			append_dev(div7, t14);
    			append_dev(div7, input2);
    			append_dev(form, t15);
    			append_dev(form, div9);
    			append_dev(div9, button);
    			append_dev(div9, t17);
    			mount_component(link2, div9, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link0_changes.$$scope = { dirty, ctx };
    			}

    			link0.$set(link0_changes);
    			const link1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link1_changes.$$scope = { dirty, ctx };
    			}

    			link1.$set(link1_changes);
    			const link2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link2_changes.$$scope = { dirty, ctx };
    			}

    			link2.$set(link2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link0.$$.fragment, local);
    			transition_in(link1.$$.fragment, local);
    			transition_in(link2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link0.$$.fragment, local);
    			transition_out(link1.$$.fragment, local);
    			transition_out(link2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div14);
    			destroy_component(link0);
    			destroy_component(link1);
    			destroy_component(link2);
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
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TambahProdukkecantikan> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TambahProdukkecantikan", $$slots, []);
    	$$self.$capture_state = () => ({ Router, Link, Route });
    	return [];
    }

    class TambahProdukkecantikan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TambahProdukkecantikan",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/Pages/Layanan.svelte generated by Svelte v3.19.2 */
    const file$8 = "src/Pages/Layanan.svelte";

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

    function create_fragment$a(ctx) {
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
    			li1.textContent = "Layanan";
    			t3 = space();
    			create_component(tableviewer.$$.fragment);
    			add_location(h1, file$8, 44, 10, 1150);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$8, 43, 8, 1117);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$8, 48, 12, 1267);
    			attr_dev(li1, "class", "breadcrumb-item active");
    			add_location(li1, file$8, 49, 12, 1352);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$8, 47, 10, 1216);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$8, 46, 8, 1183);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$8, 42, 6, 1086);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$8, 41, 4, 1050);
    			attr_dev(section, "class", "content-header");
    			add_location(section, file$8, 40, 2, 1013);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$8, 38, 0, 947);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { apiBaseUrl = "http://127.0.0.1/lumeraAPI" } = $$props;

    	let controller = {
    		title: "Daftar Layanan",
    		sub_title: "Kelola layanan disini",
    		icon: "fa fa-handshake",
    		search_selector: 1,
    		button: {
    			text: "Tambah Layanan",
    			icon: "fa fa-plus",
    			link: "tambahlayanan"
    		},
    		table_header: ["#", "Nama Layanan", "Harga", "Kategori", "Aksi"],
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
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { apiBaseUrl: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Layanan",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get apiBaseUrl() {
    		throw new Error("<Layanan>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set apiBaseUrl(value) {
    		throw new Error("<Layanan>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Component/InputEditForm.svelte generated by Svelte v3.19.2 */

    const { console: console_1$1 } = globals;
    const file$9 = "src/Component/InputEditForm.svelte";

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[8] = list;
    	child_ctx[9] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    // (90:41) <Link to = "{bread.link}">
    function create_default_slot_1$3(ctx) {
    	let t_value = /*bread*/ ctx[15].value + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*formController*/ 1 && t_value !== (t_value = /*bread*/ ctx[15].value + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$3.name,
    		type: "slot",
    		source: "(90:41) <Link to = \\\"{bread.link}\\\">",
    		ctx
    	});

    	return block;
    }

    // (89:12) {#each formController.breadcrumb as bread}
    function create_each_block_3(ctx) {
    	let li;
    	let current;

    	const link = new Link({
    			props: {
    				to: /*bread*/ ctx[15].link,
    				$$slots: { default: [create_default_slot_1$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			li = element("li");
    			create_component(link.$$.fragment);
    			attr_dev(li, "class", "breadcrumb-item");
    			add_location(li, file$9, 89, 13, 1815);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(link, li, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const link_changes = {};
    			if (dirty & /*formController*/ 1) link_changes.to = /*bread*/ ctx[15].link;

    			if (dirty & /*$$scope, formController*/ 262145) {
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
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(89:12) {#each formController.breadcrumb as bread}",
    		ctx
    	});

    	return block;
    }

    // (110:18) <Link to="{formController.breadcrumb[formController.breadcrumb.length - 1].link}">
    function create_default_slot$7(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "BATAL";
    			attr_dev(p, "class", "btn btn-danger");
    			add_location(p, file$9, 109, 100, 2670);
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
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(110:18) <Link to=\\\"{formController.breadcrumb[formController.breadcrumb.length - 1].link}\\\">",
    		ctx
    	});

    	return block;
    }

    // (120:21) {#if input.required == true}
    function create_if_block_4$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "*";
    			set_style(span, "color", "red");
    			add_location(span, file$9, 120, 22, 3138);
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
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(120:21) {#if input.required == true}",
    		ctx
    	});

    	return block;
    }

    // (143:42) 
    function create_if_block_3$1(ctx) {
    	let each_1_anchor;
    	let each_value_2 = /*input*/ ctx[7].option;
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
    				each_value_2 = /*input*/ ctx[7].option;
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
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(143:42) ",
    		ctx
    	});

    	return block;
    }

    // (134:47) 
    function create_if_block_2$1(ctx) {
    	let select;
    	let option;
    	let dispose;
    	let each_value_1 = /*input*/ ctx[7].option;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	function select_change_handler() {
    		/*select_change_handler*/ ctx[4].call(select, /*input*/ ctx[7]);
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
    			add_location(option, file$9, 135, 25, 3908);
    			attr_dev(select, "class", "form-control");
    			if (/*input*/ ctx[7].text === void 0) add_render_callback(select_change_handler);
    			add_location(select, file$9, 134, 11, 3829);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);
    			append_dev(select, option);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*input*/ ctx[7].text);
    			dispose = listen_dev(select, "change", select_change_handler);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*formController*/ 1) {
    				each_value_1 = /*input*/ ctx[7].option;
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
    				select_option(select, /*input*/ ctx[7].text);
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
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(134:47) ",
    		ctx
    	});

    	return block;
    }

    // (130:43) 
    function create_if_block_1$3(ctx) {
    	let input;
    	let input_required_value;
    	let input_placeholder_value;
    	let input_updating = false;
    	let dispose;

    	function input_input_handler_1() {
    		input_updating = true;
    		/*input_input_handler_1*/ ctx[3].call(input, /*input*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "number");
    			input.required = input_required_value = /*input*/ ctx[7].required;
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "id", "service");
    			attr_dev(input, "placeholder", input_placeholder_value = /*input*/ ctx[7].placeholder);
    			add_location(input, file$9, 130, 11, 3593);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*input*/ ctx[7].text);
    			dispose = listen_dev(input, "input", input_input_handler_1);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*formController*/ 1 && input_required_value !== (input_required_value = /*input*/ ctx[7].required)) {
    				prop_dev(input, "required", input_required_value);
    			}

    			if (dirty & /*formController*/ 1 && input_placeholder_value !== (input_placeholder_value = /*input*/ ctx[7].placeholder)) {
    				attr_dev(input, "placeholder", input_placeholder_value);
    			}

    			if (!input_updating && dirty & /*formController*/ 1) {
    				set_input_value(input, /*input*/ ctx[7].text);
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
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(130:43) ",
    		ctx
    	});

    	return block;
    }

    // (126:19) {#if input.type == "text"}
    function create_if_block$3(ctx) {
    	let input;
    	let input_required_value;
    	let input_placeholder_value;
    	let dispose;

    	function input_input_handler() {
    		/*input_input_handler*/ ctx[2].call(input, /*input*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "text");
    			input.required = input_required_value = /*input*/ ctx[7].required;
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "id", "service");
    			attr_dev(input, "placeholder", input_placeholder_value = /*input*/ ctx[7].placeholder);
    			add_location(input, file$9, 126, 14, 3367);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*input*/ ctx[7].text);
    			dispose = listen_dev(input, "input", input_input_handler);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*formController*/ 1 && input_required_value !== (input_required_value = /*input*/ ctx[7].required)) {
    				prop_dev(input, "required", input_required_value);
    			}

    			if (dirty & /*formController*/ 1 && input_placeholder_value !== (input_placeholder_value = /*input*/ ctx[7].placeholder)) {
    				attr_dev(input, "placeholder", input_placeholder_value);
    			}

    			if (dirty & /*formController*/ 1 && input.value !== /*input*/ ctx[7].text) {
    				set_input_value(input, /*input*/ ctx[7].text);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(126:19) {#if input.type == \\\"text\\\"}",
    		ctx
    	});

    	return block;
    }

    // (144:7) {#each input.option as option}
    function create_each_block_2$1(ctx) {
    	let br;
    	let t0;
    	let label;
    	let input;
    	let input_value_value;
    	let t1;
    	let t2_value = /*option*/ ctx[10].label + "";
    	let t2;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[5].call(input, /*input*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			br = element("br");
    			t0 = space();
    			label = element("label");
    			input = element("input");
    			t1 = space();
    			t2 = text(t2_value);
    			add_location(br, file$9, 144, 8, 4266);
    			attr_dev(input, "type", "radio");
    			input.__value = input_value_value = /*option*/ ctx[10].value;
    			input.value = input.__value;
    			/*$$binding_groups*/ ctx[6][0].push(input);
    			add_location(input, file$9, 146, 9, 4297);
    			add_location(label, file$9, 145, 8, 4280);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			input.checked = input.__value === /*input*/ ctx[7].text;
    			append_dev(label, t1);
    			append_dev(label, t2);
    			dispose = listen_dev(input, "change", input_change_handler);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*formController*/ 1 && input_value_value !== (input_value_value = /*option*/ ctx[10].value)) {
    				prop_dev(input, "__value", input_value_value);
    			}

    			input.value = input.__value;

    			if (dirty & /*formController*/ 1) {
    				input.checked = input.__value === /*input*/ ctx[7].text;
    			}

    			if (dirty & /*formController*/ 1 && t2_value !== (t2_value = /*option*/ ctx[10].label + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(label);
    			/*$$binding_groups*/ ctx[6][0].splice(/*$$binding_groups*/ ctx[6][0].indexOf(input), 1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(144:7) {#each input.option as option}",
    		ctx
    	});

    	return block;
    }

    // (137:25) {#each input.option as option}
    function create_each_block_1$2(ctx) {
    	let option;
    	let t_value = /*option*/ ctx[10] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*option*/ ctx[10];
    			option.value = option.__value;
    			add_location(option, file$9, 137, 25, 4032);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*formController*/ 1 && t_value !== (t_value = /*option*/ ctx[10] + "")) set_data_dev(t, t_value);

    			if (dirty & /*formController*/ 1 && option_value_value !== (option_value_value = /*option*/ ctx[10])) {
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
    		source: "(137:25) {#each input.option as option}",
    		ctx
    	});

    	return block;
    }

    // (115:19) {#each formController.forms as input}
    function create_each_block$2(ctx) {
    	let div;
    	let label;
    	let t0_value = /*input*/ ctx[7].label + "";
    	let t0;
    	let t1;
    	let t2;
    	let if_block0 = /*input*/ ctx[7].required == true && create_if_block_4$1(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*input*/ ctx[7].type == "text") return create_if_block$3;
    		if (/*input*/ ctx[7].type == "number") return create_if_block_1$3;
    		if (/*input*/ ctx[7].type == "select_box") return create_if_block_2$1;
    		if (/*input*/ ctx[7].type == "radio") return create_if_block_3$1;
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
    			add_location(label, file$9, 117, 20, 2994);
    			attr_dev(div, "class", "form-group col-md-12 ml-1 mr-1");
    			add_location(div, file$9, 116, 19, 2929);
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
    			if (dirty & /*formController*/ 1 && t0_value !== (t0_value = /*input*/ ctx[7].label + "")) set_data_dev(t0, t0_value);

    			if (/*input*/ ctx[7].required == true) {
    				if (!if_block0) {
    					if_block0 = create_if_block_4$1(ctx);
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
    		source: "(115:19) {#each formController.forms as input}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
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
    		each_blocks_1[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	const link = new Link({
    			props: {
    				to: /*formController*/ ctx[0].breadcrumb[/*formController*/ ctx[0].breadcrumb.length - 1].link,
    				$$slots: { default: [create_default_slot$7] },
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
    			button.textContent = "TAMBAHKAN LAYANAN";
    			add_location(h1, file$9, 84, 11, 1639);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$9, 83, 9, 1605);
    			attr_dev(li, "class", "breadcrumb-item active");
    			add_location(li, file$9, 91, 13, 1928);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$9, 87, 11, 1708);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$9, 86, 9, 1674);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$9, 82, 7, 1573);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$9, 81, 5, 1536);
    			attr_dev(section0, "class", "content-header");
    			add_location(section0, file$9, 80, 1, 1498);
    			attr_dev(i, "class", i_class_value = "" + (/*formController*/ ctx[0].header.icon + " mr-2"));
    			add_location(i, file$9, 107, 40, 2413);
    			attr_dev(h5, "class", "mt-1 mb-0");
    			add_location(h5, file$9, 107, 18, 2391);
    			set_style(div4, "position", "absolute");
    			set_style(div4, "right", "20px");
    			set_style(div4, "top", "18px");
    			add_location(div4, file$9, 108, 18, 2515);
    			attr_dev(div5, "class", "card-header mb-2");
    			add_location(div5, file$9, 106, 15, 2342);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$9, 157, 21, 4564);
    			attr_dev(div6, "class", "card-footer");
    			add_location(div6, file$9, 156, 19, 4517);
    			attr_dev(form, "class", "mt-3");
    			add_location(form, file$9, 112, 17, 2773);
    			attr_dev(div7, "class", "card card-primary card-outline");
    			add_location(div7, file$9, 104, 13, 2281);
    			attr_dev(div8, "class", "col-md-12");
    			add_location(div8, file$9, 102, 10, 2201);
    			attr_dev(div9, "class", "row");
    			add_location(div9, file$9, 100, 8, 2142);
    			attr_dev(div10, "class", "container-fluid");
    			add_location(div10, file$9, 99, 5, 2104);
    			attr_dev(section1, "class", "content");
    			add_location(section1, file$9, 98, 1, 2073);
    			attr_dev(div11, "class", "container");
    			add_location(div11, file$9, 77, 0, 1455);
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
    			current = true;
    			dispose = listen_dev(form, "submit", prevent_default(/*post_request*/ ctx[1]), false, true, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*formController*/ 1) {
    				each_value_3 = /*formController*/ ctx[0].breadcrumb;
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_3(child_ctx);
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

    			if (dirty & /*$$scope*/ 262144) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);

    			if (dirty & /*formController*/ 1) {
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
    			dispose();
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

    function httpRequest(api) {
    	fetch(api, { method: "GET" }).then(res => res.json()).then(data => {
    		data_raw = data;
    		console.log(data_raw);
    	}).catch(err => {
    		
    	});
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { formController } = $$props;

    	onMount(async => {
    		
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
    				if (i == formController.forms.length - 1) {
    					temporary_get_gate = temporary_get_gate + "data_" + i + "=" + formController.forms[i].text;
    				} else {
    					temporary_get_gate = temporary_get_gate + "data_" + i + "=" + formController.forms[i].text + "&";
    				}
    			}
    		}

    		if (validation == 1) {
    			httpRequest(formController + temporary_get_gate);
    		}
    	}

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

    	function input_input_handler_1(input) {
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
    		post_request,
    		httpRequest
    	});

    	$$self.$inject_state = $$props => {
    		if ("formController" in $$props) $$invalidate(0, formController = $$props.formController);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		formController,
    		post_request,
    		input_input_handler,
    		input_input_handler_1,
    		select_change_handler,
    		input_change_handler,
    		$$binding_groups
    	];
    }

    class InputEditForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { formController: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InputEditForm",
    			options,
    			id: create_fragment$b.name
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

    /* src/Pages/TambahLayanan.svelte generated by Svelte v3.19.2 */

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
    		p: noop,
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
    	let { apiBaseUrl = "http://127.0.0.1/lumeraAPI" } = $$props;

    	let formController = {
    		header: {
    			title: "Tambah Layanan",
    			icon: "fas fa-plus-square"
    		},
    		breadcrumb: [
    			{ link: "dashboard", value: "Dashboard" },
    			{ link: "layanan", value: "Layanan" }
    		],
    		api: {
    			apiUrl: apiBaseUrl + "/master_data/insertEditServices.php"
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
    				type: "number"
    			},
    			{
    				label: "Kategori",
    				required: true,
    				text: "",
    				type: "select_box",
    				option: ["Klinik", "Salon"]
    			}
    		], /*
    {
      label : "Status",
      required : true,
      text : 0,
      type : "radio",
      option : [
        {
          label : "Aktif",
          value : 1
        },
        {
          label : "Tidak Aktif",
          value : 0
        }
      ]
    }*/
    		
    	};

    	const writable_props = ["apiBaseUrl"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TambahLayanan> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TambahLayanan", $$slots, []);

    	$$self.$set = $$props => {
    		if ("apiBaseUrl" in $$props) $$invalidate(1, apiBaseUrl = $$props.apiBaseUrl);
    	};

    	$$self.$capture_state = () => ({
    		apiBaseUrl,
    		Router,
    		Link,
    		Route,
    		InputEditForm,
    		formController
    	});

    	$$self.$inject_state = $$props => {
    		if ("apiBaseUrl" in $$props) $$invalidate(1, apiBaseUrl = $$props.apiBaseUrl);
    		if ("formController" in $$props) $$invalidate(0, formController = $$props.formController);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [formController, apiBaseUrl];
    }

    class TambahLayanan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { apiBaseUrl: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TambahLayanan",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get apiBaseUrl() {
    		throw new Error("<TambahLayanan>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set apiBaseUrl(value) {
    		throw new Error("<TambahLayanan>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Pages/Pasien.svelte generated by Svelte v3.19.2 */
    const file$a = "src/Pages/Pasien.svelte";

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
    				$$slots: { default: [create_default_slot$8] },
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
    			add_location(h1, file$a, 44, 10, 1163);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$a, 43, 8, 1130);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$a, 48, 12, 1280);
    			attr_dev(li1, "class", "breadcrumb-item active");
    			add_location(li1, file$a, 49, 12, 1365);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$a, 47, 10, 1229);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$a, 46, 8, 1196);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$a, 42, 6, 1099);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$a, 41, 4, 1063);
    			attr_dev(section, "class", "content-header");
    			add_location(section, file$a, 40, 2, 1026);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$a, 38, 0, 960);
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
    		title: "Daftar Pasien",
    		sub_title: "Kelola pasien disini",
    		icon: "fa fa-address-card",
    		search_selector: 1,
    		button: {
    			text: "Tambah Pasien",
    			icon: "fa fa-plus",
    			link: "tambahpasien"
    		},
    		table_header: ["#", "Nama Pasien", "Alamat", "No. HP", "Tanggal Lahir", "Aksi"],
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

    /* src/Pages/TambahPasien.svelte generated by Svelte v3.19.2 */
    const file$b = "src/Pages/TambahPasien.svelte";

    // (20:40) <Link to = "dashboard">
    function create_default_slot_2$2(ctx) {
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
    		id: create_default_slot_2$2.name,
    		type: "slot",
    		source: "(20:40) <Link to = \\\"dashboard\\\">",
    		ctx
    	});

    	return block;
    }

    // (21:40) <Link to = "pasien">
    function create_default_slot_1$4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Pasien");
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
    		id: create_default_slot_1$4.name,
    		type: "slot",
    		source: "(21:40) <Link to = \\\"pasien\\\">",
    		ctx
    	});

    	return block;
    }

    // (70:18) <Link to="pasien">
    function create_default_slot$9(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "BATAL";
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-danger");
    			add_location(button, file$b, 69, 36, 2903);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$9.name,
    		type: "slot",
    		source: "(70:18) <Link to=\\\"pasien\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let div17;
    	let section0;
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
    	let t2;
    	let li2;
    	let t4;
    	let section1;
    	let div16;
    	let div15;
    	let div14;
    	let div13;
    	let div4;
    	let h5;
    	let i0;
    	let t5;
    	let t6;
    	let form;
    	let div11;
    	let div5;
    	let label0;
    	let t8;
    	let input0;
    	let t9;
    	let div6;
    	let label1;
    	let t11;
    	let textarea;
    	let t12;
    	let div7;
    	let label2;
    	let t14;
    	let input1;
    	let t15;
    	let div10;
    	let label3;
    	let t17;
    	let div9;
    	let div8;
    	let span;
    	let i1;
    	let t18;
    	let input2;
    	let t19;
    	let div12;
    	let button;
    	let t21;
    	let current;

    	const link0 = new Link({
    			props: {
    				to: "dashboard",
    				$$slots: { default: [create_default_slot_2$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const link1 = new Link({
    			props: {
    				to: "pasien",
    				$$slots: { default: [create_default_slot_1$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const link2 = new Link({
    			props: {
    				to: "pasien",
    				$$slots: { default: [create_default_slot$9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div17 = element("div");
    			section0 = element("section");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = space();
    			div1 = element("div");
    			ol = element("ol");
    			li0 = element("li");
    			create_component(link0.$$.fragment);
    			t1 = space();
    			li1 = element("li");
    			create_component(link1.$$.fragment);
    			t2 = space();
    			li2 = element("li");
    			li2.textContent = "Tambah Pasien";
    			t4 = space();
    			section1 = element("section");
    			div16 = element("div");
    			div15 = element("div");
    			div14 = element("div");
    			div13 = element("div");
    			div4 = element("div");
    			h5 = element("h5");
    			i0 = element("i");
    			t5 = text("Tambah Pasien");
    			t6 = space();
    			form = element("form");
    			div11 = element("div");
    			div5 = element("div");
    			label0 = element("label");
    			label0.textContent = "Nama Pasien";
    			t8 = space();
    			input0 = element("input");
    			t9 = space();
    			div6 = element("div");
    			label1 = element("label");
    			label1.textContent = "Alamat";
    			t11 = space();
    			textarea = element("textarea");
    			t12 = space();
    			div7 = element("div");
    			label2 = element("label");
    			label2.textContent = "No. HP";
    			t14 = space();
    			input1 = element("input");
    			t15 = space();
    			div10 = element("div");
    			label3 = element("label");
    			label3.textContent = "Tanggal Lahir";
    			t17 = space();
    			div9 = element("div");
    			div8 = element("div");
    			span = element("span");
    			i1 = element("i");
    			t18 = space();
    			input2 = element("input");
    			t19 = space();
    			div12 = element("div");
    			button = element("button");
    			button.textContent = "TAMBAHKAN PASIEN";
    			t21 = space();
    			create_component(link2.$$.fragment);
    			add_location(h1, file$b, 15, 10, 411);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$b, 14, 8, 378);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$b, 19, 12, 528);
    			attr_dev(li1, "class", "breadcrumb-item");
    			add_location(li1, file$b, 20, 12, 613);
    			attr_dev(li2, "class", "breadcrumb-item active");
    			add_location(li2, file$b, 21, 12, 692);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$b, 18, 10, 477);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$b, 17, 8, 444);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$b, 13, 6, 347);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$b, 12, 4, 311);
    			attr_dev(section0, "class", "content-header");
    			add_location(section0, file$b, 11, 2, 274);
    			attr_dev(i0, "class", "fas fa-plus-square mr-2");
    			add_location(i0, file$b, 37, 36, 1156);
    			attr_dev(h5, "class", "mt-1 mb-0");
    			add_location(h5, file$b, 37, 14, 1134);
    			attr_dev(div4, "class", "card-header");
    			add_location(div4, file$b, 36, 12, 1094);
    			attr_dev(label0, "for", "patient_name important-form");
    			add_location(label0, file$b, 44, 20, 1440);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "patient_name");
    			attr_dev(input0, "placeholder", "Masukkan Nama Pasien");
    			add_location(input0, file$b, 45, 20, 1521);
    			attr_dev(div5, "class", "form-group");
    			add_location(div5, file$b, 43, 18, 1395);
    			attr_dev(label1, "for", "patient_address");
    			add_location(label1, file$b, 48, 20, 1703);
    			attr_dev(textarea, "class", "form-control");
    			attr_dev(textarea, "id", "patient_address");
    			attr_dev(textarea, "rows", "3");
    			attr_dev(textarea, "placeholder", "Masukkan Alamat");
    			add_location(textarea, file$b, 49, 20, 1767);
    			attr_dev(div6, "class", "form-group");
    			add_location(div6, file$b, 47, 18, 1658);
    			attr_dev(label2, "for", "patient_hp");
    			add_location(label2, file$b, 52, 20, 1958);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "id", "patient_hp");
    			attr_dev(input1, "placeholder", "Masukkan No. HP");
    			add_location(input1, file$b, 53, 20, 2017);
    			attr_dev(div7, "class", "form-group");
    			add_location(div7, file$b, 51, 18, 1913);
    			attr_dev(label3, "for", "patient_dob");
    			add_location(label3, file$b, 56, 20, 2192);
    			attr_dev(i1, "class", "ni ni-calendar-grid-58");
    			add_location(i1, file$b, 59, 55, 2420);
    			attr_dev(span, "class", "input-group-text");
    			add_location(span, file$b, 59, 24, 2389);
    			attr_dev(div8, "class", "input-group-prepend");
    			add_location(div8, file$b, 58, 22, 2331);
    			attr_dev(input2, "class", "form-control datepicker");
    			attr_dev(input2, "placeholder", "Pilih Tanggal Lahir");
    			attr_dev(input2, "type", "date");
    			input2.value = "MM/DD/YYYY";
    			add_location(input2, file$b, 61, 22, 2517);
    			attr_dev(div9, "class", "input-group input-group-alternative");
    			add_location(div9, file$b, 57, 20, 2259);
    			attr_dev(div10, "class", "form-group");
    			add_location(div10, file$b, 55, 18, 2147);
    			attr_dev(div11, "class", "card-body");
    			add_location(div11, file$b, 42, 16, 1353);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$b, 68, 18, 2795);
    			attr_dev(div12, "class", "card-footer");
    			add_location(div12, file$b, 67, 16, 2751);
    			attr_dev(form, "role", "form");
    			add_location(form, file$b, 41, 14, 1318);
    			attr_dev(div13, "class", "card card-primary card-outline");
    			add_location(div13, file$b, 35, 10, 1037);
    			attr_dev(div14, "class", "col-md-12");
    			add_location(div14, file$b, 33, 8, 962);
    			attr_dev(div15, "class", "row");
    			add_location(div15, file$b, 31, 6, 907);
    			attr_dev(div16, "class", "container-fluid");
    			add_location(div16, file$b, 30, 4, 871);
    			attr_dev(section1, "class", "content");
    			add_location(section1, file$b, 29, 2, 841);
    			attr_dev(div17, "class", "container");
    			add_location(div17, file$b, 9, 0, 208);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div17, anchor);
    			append_dev(div17, section0);
    			append_dev(section0, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, ol);
    			append_dev(ol, li0);
    			mount_component(link0, li0, null);
    			append_dev(ol, t1);
    			append_dev(ol, li1);
    			mount_component(link1, li1, null);
    			append_dev(ol, t2);
    			append_dev(ol, li2);
    			append_dev(div17, t4);
    			append_dev(div17, section1);
    			append_dev(section1, div16);
    			append_dev(div16, div15);
    			append_dev(div15, div14);
    			append_dev(div14, div13);
    			append_dev(div13, div4);
    			append_dev(div4, h5);
    			append_dev(h5, i0);
    			append_dev(h5, t5);
    			append_dev(div13, t6);
    			append_dev(div13, form);
    			append_dev(form, div11);
    			append_dev(div11, div5);
    			append_dev(div5, label0);
    			append_dev(div5, t8);
    			append_dev(div5, input0);
    			append_dev(div11, t9);
    			append_dev(div11, div6);
    			append_dev(div6, label1);
    			append_dev(div6, t11);
    			append_dev(div6, textarea);
    			append_dev(div11, t12);
    			append_dev(div11, div7);
    			append_dev(div7, label2);
    			append_dev(div7, t14);
    			append_dev(div7, input1);
    			append_dev(div11, t15);
    			append_dev(div11, div10);
    			append_dev(div10, label3);
    			append_dev(div10, t17);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, span);
    			append_dev(span, i1);
    			append_dev(div9, t18);
    			append_dev(div9, input2);
    			append_dev(form, t19);
    			append_dev(form, div12);
    			append_dev(div12, button);
    			append_dev(div12, t21);
    			mount_component(link2, div12, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link0_changes.$$scope = { dirty, ctx };
    			}

    			link0.$set(link0_changes);
    			const link1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link1_changes.$$scope = { dirty, ctx };
    			}

    			link1.$set(link1_changes);
    			const link2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link2_changes.$$scope = { dirty, ctx };
    			}

    			link2.$set(link2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link0.$$.fragment, local);
    			transition_in(link1.$$.fragment, local);
    			transition_in(link2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link0.$$.fragment, local);
    			transition_out(link1.$$.fragment, local);
    			transition_out(link2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div17);
    			destroy_component(link0);
    			destroy_component(link1);
    			destroy_component(link2);
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
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TambahPasien> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TambahPasien", $$slots, []);
    	$$self.$capture_state = () => ({ Router, Link, Route });
    	return [];
    }

    class TambahPasien extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TambahPasien",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src/Pages/Dashboard.svelte generated by Svelte v3.19.2 */

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

    /* src/App.svelte generated by Svelte v3.19.2 */
    const file$c = "src/App.svelte";

    // (38:0) <Router>
    function create_default_slot$a(ctx) {
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
    	let footer;
    	let div1;
    	let b;
    	let t11;
    	let t12;
    	let strong;
    	let t13;
    	let a;
    	let t15;
    	let t16;
    	let current;
    	const sidebar = new Sidebar({ $$inline: true });
    	sidebar.$on("message", /*handleMessage*/ ctx[1]);

    	const route0 = new Route({
    			props: { path: "dashboard", component: Dashboard },
    			$$inline: true
    		});

    	const route1 = new Route({
    			props: { path: "staf", component: Staf },
    			$$inline: true
    		});

    	const route2 = new Route({
    			props: {
    				path: "tambahstaf",
    				component: TambahStaf
    			},
    			$$inline: true
    		});

    	const route3 = new Route({
    			props: {
    				path: "produkkecantikan",
    				component: Produkkecantikan
    			},
    			$$inline: true
    		});

    	const route4 = new Route({
    			props: {
    				path: "tambahprodukkecantikan",
    				component: TambahProdukkecantikan
    			},
    			$$inline: true
    		});

    	const route5 = new Route({
    			props: { path: "layanan", component: Layanan },
    			$$inline: true
    		});

    	const route6 = new Route({
    			props: {
    				path: "tambahlayanan",
    				component: TambahLayanan
    			},
    			$$inline: true
    		});

    	const route7 = new Route({
    			props: { path: "pasien", component: Pasien },
    			$$inline: true
    		});

    	const route8 = new Route({
    			props: {
    				path: "tambahpasien",
    				component: TambahPasien
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
    			footer = element("footer");
    			div1 = element("div");
    			b = element("b");
    			b.textContent = "Version";
    			t11 = text(" 1.0");
    			t12 = space();
    			strong = element("strong");
    			t13 = text("Copyright © 2020 ");
    			a = element("a");
    			a.textContent = "Lumera System";
    			t15 = text(".");
    			t16 = text(" All rights reserved.");
    			attr_dev(div0, "class", "content-wrapper svelte-kqx5hh");
    			set_style(div0, "margin-left", /*containerMarginVisibletoSidebar*/ ctx[0] + "px");
    			add_location(div0, file$c, 40, 3, 1204);
    			add_location(b, file$c, 55, 8, 2024);
    			attr_dev(div1, "class", "float-right d-none d-sm-block");
    			add_location(div1, file$c, 54, 5, 1972);
    			attr_dev(a, "href", "#");
    			add_location(a, file$c, 57, 35, 2090);
    			add_location(strong, file$c, 57, 5, 2060);
    			attr_dev(footer, "class", "main-footer svelte-kqx5hh");
    			set_style(footer, "margin-left", /*containerMarginVisibletoSidebar*/ ctx[0] + "px");
    			add_location(footer, file$c, 53, 3, 1880);
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
    			insert_dev(target, t9, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div1);
    			append_dev(div1, b);
    			append_dev(div1, t11);
    			append_dev(footer, t12);
    			append_dev(footer, strong);
    			append_dev(strong, t13);
    			append_dev(strong, a);
    			append_dev(strong, t15);
    			append_dev(footer, t16);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
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
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$a.name,
    		type: "slot",
    		source: "(38:0) <Router>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let current;

    	const router = new Router({
    			props: {
    				$$slots: { default: [create_default_slot$a] },
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

    			if (dirty & /*$$scope, containerMarginVisibletoSidebar*/ 5) {
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
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$g.name
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
