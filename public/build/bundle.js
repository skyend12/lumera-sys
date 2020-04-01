
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
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
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

    // (222:10) {#if nav_item.nav_child.length > 0}
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
    			add_location(i, file$2, 224, 16, 6039);
    			attr_dev(p, "class", "mt-0 col-10");
    			add_location(p, file$2, 225, 16, 6116);
    			attr_dev(div0, "class", "row text-white position-relative");
    			add_location(div0, file$2, 223, 14, 5976);
    			attr_dev(div1, "class", "nav-argon-item mt-2 svelte-j1xut8");
    			add_location(div1, file$2, 222, 12, 5886);
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
    		source: "(222:10) {#if nav_item.nav_child.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (227:16) {#if nav_item.nav_child.length > 0}
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
    			add_location(i, file$2, 227, 18, 6233);
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
    		source: "(227:16) {#if nav_item.nav_child.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (232:12) {#if nav_item.nav_show_child == true}
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

    			add_location(div, file$2, 232, 14, 6459);
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
    		source: "(232:12) {#if nav_item.nav_show_child == true}",
    		ctx
    	});

    	return block;
    }

    // (235:18) <Link to="{nav_child.nav_to}">
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
    			add_location(i, file$2, 236, 22, 6768);
    			attr_dev(p, "class", "mt-0 col-10");
    			add_location(p, file$2, 237, 22, 6852);
    			attr_dev(div, "class", "nav-argon-item row text-white position-relative ml-1 svelte-j1xut8");
    			add_location(div, file$2, 235, 20, 6637);
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
    		source: "(235:18) <Link to=\\\"{nav_child.nav_to}\\\">",
    		ctx
    	});

    	return block;
    }

    // (234:16) {#each nav_item.nav_child as nav_child}
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
    		source: "(234:16) {#each nav_item.nav_child as nav_child}",
    		ctx
    	});

    	return block;
    }

    // (246:10) {#if nav_item.nav_child.length == 0}
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
    		source: "(246:10) {#if nav_item.nav_child.length == 0}",
    		ctx
    	});

    	return block;
    }

    // (252:18) {#if nav_item.nav_child.length > 0}
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
    			add_location(i, file$2, 252, 20, 7465);
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
    		source: "(252:18) {#if nav_item.nav_child.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (247:12) <Link to="{nav_item.nav_to}">
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
    			add_location(i, file$2, 249, 18, 7265);
    			attr_dev(p, "class", "mt-0 col-10");
    			add_location(p, file$2, 250, 18, 7344);
    			attr_dev(div0, "class", "row text-white position-relative");
    			add_location(div0, file$2, 248, 16, 7200);
    			attr_dev(div1, "class", "nav-argon-item mt-2 svelte-j1xut8");
    			add_location(div1, file$2, 247, 14, 7150);
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
    		source: "(247:12) <Link to=\\\"{nav_item.nav_to}\\\">",
    		ctx
    	});

    	return block;
    }

    // (220:8) {#each navbar_item as nav_item}
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
    		source: "(220:8) {#each navbar_item as nav_item}",
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
    			add_location(img0, file$2, 192, 10, 4736);
    			attr_dev(div0, "class", "col-4");
    			add_location(div0, file$2, 191, 8, 4706);
    			attr_dev(p0, "class", "brand-text-1 mb-1 font-weight-light svelte-j1xut8");
    			add_location(p0, file$2, 195, 10, 4885);
    			attr_dev(p1, "class", "brand-text-2 mt-0 font-weight-bold svelte-j1xut8");
    			add_location(p1, file$2, 196, 10, 4956);
    			attr_dev(div1, "class", "col-6 mt-3 ml-2");
    			add_location(div1, file$2, 194, 8, 4845);
    			attr_dev(div2, "class", "row w-100");
    			add_location(div2, file$2, 190, 6, 4674);
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "class", "brand-link");
    			add_location(a0, file$2, 189, 4, 4636);
    			attr_dev(img1, "alt", "Image placeholder");
    			if (img1.src !== (img1_src_value = "./assets/img/profile_picture/avatar_1.jpg")) attr_dev(img1, "src", img1_src_value);
    			add_location(img1, file$2, 207, 14, 5348);
    			attr_dev(a1, "href", "javascript:;");
    			attr_dev(a1, "class", "avatar rounded-circle");
    			add_location(a1, file$2, 206, 10, 5280);
    			attr_dev(p2, "class", "user-authorization-name m-0 mb-1 svelte-j1xut8");
    			add_location(p2, file$2, 210, 12, 5501);
    			attr_dev(p3, "class", "user-authorization-status svelte-j1xut8");
    			add_location(p3, file$2, 211, 12, 5571);
    			attr_dev(div3, "class", "user-authorization-info svelte-j1xut8");
    			add_location(div3, file$2, 209, 10, 5451);
    			attr_dev(div4, "class", "user-panel mt-1 ml-0 d-flex elevation-2 pt-3 pl-3 pb-1 svelte-j1xut8");
    			add_location(div4, file$2, 204, 6, 5163);
    			attr_dev(hr, "class", "mt-3 mb-4");
    			add_location(hr, file$2, 215, 6, 5663);
    			attr_dev(nav0, "class", "mt-3 container");
    			add_location(nav0, file$2, 218, 6, 5723);
    			attr_dev(div5, "class", "sidebar");
    			add_location(div5, file$2, 202, 4, 5090);
    			attr_dev(div6, "class", "text-white");
    			set_style(div6, "margin", "7px");
    			add_location(div6, file$2, 186, 2, 4557);
    			attr_dev(aside, "class", "main-sidebar bg-primary elevation-4 sidebar-anim svelte-j1xut8");
    			set_style(aside, "position", "fixed");
    			set_style(aside, "height", "100vh");
    			set_style(aside, "transform", "translateX(" + /*sidebar_visible*/ ctx[1] + "px)");
    			set_style(aside, "overflow-y", "auto");
    			add_location(aside, file$2, 184, 0, 4388);
    			attr_dev(i0, "class", "fas fa-bars");
    			add_location(i0, file$2, 269, 80, 8113);
    			attr_dev(a2, "class", "nav-link text-primary");
    			attr_dev(a2, "role", "button");
    			add_location(a2, file$2, 269, 8, 8041);
    			attr_dev(li0, "class", "nav-item");
    			set_style(li0, "cursor", "pointer");
    			add_location(li0, file$2, 268, 6, 7986);
    			attr_dev(ul0, "class", "navbar-nav");
    			add_location(ul0, file$2, 267, 4, 7956);
    			attr_dev(i1, "class", "fas fa-cogs");
    			add_location(i1, file$2, 275, 99, 8362);
    			attr_dev(a3, "class", "nav-link");
    			attr_dev(a3, "data-widget", "control-sidebar");
    			attr_dev(a3, "data-slide", "true");
    			attr_dev(a3, "href", "#");
    			attr_dev(a3, "role", "button");
    			add_location(a3, file$2, 275, 8, 8271);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file$2, 274, 6, 8241);
    			attr_dev(ul1, "class", "navbar-nav ml-auto");
    			add_location(ul1, file$2, 273, 4, 8203);
    			attr_dev(nav1, "class", "main-header navbar navbar-expand");
    			set_style(nav1, "margin-left", /*navbar_margin*/ ctx[2] + "px");
    			set_style(nav1, "transition", "all 0.5s linear");
    			set_style(nav1, "padding", "0px 0px 18px 0px ");
    			set_style(nav1, "height", "auto");
    			set_style(nav1, "background-color", "#fff");
    			add_location(nav1, file$2, 265, 2, 7746);
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

    /* src/Pages/Staf.svelte generated by Svelte v3.19.2 */
    const file$3 = "src/Pages/Staf.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (64:42) <Link to = "dashboard">
    function create_default_slot_1$1(ctx) {
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
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(64:42) <Link to = \\\"dashboard\\\">",
    		ctx
    	});

    	return block;
    }

    // (95:18) <Link to="tambahstaf">
    function create_default_slot$1(ctx) {
    	let button;
    	let i;
    	let t;

    	const block = {
    		c: function create() {
    			button = element("button");
    			i = element("i");
    			t = text(" Tambah Staf");
    			attr_dev(i, "class", "fa fa-plus mr-2");
    			add_location(i, file$3, 96, 22, 2795);
    			attr_dev(button, "class", "btn btn-primary btn-round btn-md");
    			add_location(button, file$3, 95, 20, 2723);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, i);
    			append_dev(button, t);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(95:18) <Link to=\\\"tambahstaf\\\">",
    		ctx
    	});

    	return block;
    }

    // (114:20) {#each staff_data as staff}
    function create_each_block$1(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*staff*/ ctx[1].id + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*staff*/ ctx[1].nama_lengkap + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*staff*/ ctx[1].posisi + "";
    	let t4;
    	let t5;
    	let td3;
    	let span;
    	let t6_value = /*staff*/ ctx[1].status + "";
    	let t6;
    	let t7;
    	let td4;
    	let button0;
    	let i0;
    	let t8;
    	let button1;
    	let i1;
    	let t9;

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
    			span = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			button0 = element("button");
    			i0 = element("i");
    			t8 = space();
    			button1 = element("button");
    			i1 = element("i");
    			t9 = space();
    			attr_dev(td0, "class", "text-center");
    			add_location(td0, file$3, 115, 26, 3475);
    			add_location(td1, file$3, 116, 26, 3541);
    			add_location(td2, file$3, 117, 26, 3597);
    			attr_dev(span, "class", "badge badge-success");
    			add_location(span, file$3, 118, 30, 3651);
    			add_location(td3, file$3, 118, 26, 3647);
    			attr_dev(i0, "class", "fa fa-pencil-ruler pt-1");
    			add_location(i0, file$3, 121, 30, 3938);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "rel", "tooltip");
    			attr_dev(button0, "class", "btn btn-info btn-icon btn-sm ");
    			attr_dev(button0, "data-original-title", "");
    			attr_dev(button0, "title", "");
    			add_location(button0, file$3, 120, 28, 3801);
    			attr_dev(i1, "class", "fa fa-trash pt-1");
    			add_location(i1, file$3, 123, 136, 4152);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "rel", "tooltip");
    			attr_dev(button1, "class", "btn btn-danger btn-icon btn-sm ");
    			attr_dev(button1, "data-original-title", "");
    			attr_dev(button1, "title", "");
    			add_location(button1, file$3, 123, 28, 4044);
    			attr_dev(td4, "class", "td-actions text-right");
    			add_location(td4, file$3, 119, 26, 3738);
    			add_location(tr, file$3, 114, 22, 3444);
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
    			append_dev(td3, span);
    			append_dev(span, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td4);
    			append_dev(td4, button0);
    			append_dev(button0, i0);
    			append_dev(td4, t8);
    			append_dev(td4, button1);
    			append_dev(button1, i1);
    			append_dev(tr, t9);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(114:20) {#each staff_data as staff}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div15;
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
    	let t3;
    	let section1;
    	let div14;
    	let div13;
    	let div12;
    	let div11;
    	let div10;
    	let div5;
    	let i0;
    	let t4;
    	let div4;
    	let h5;
    	let t6;
    	let p;
    	let t8;
    	let div9;
    	let div8;
    	let div7;
    	let input;
    	let t9;
    	let div6;
    	let span;
    	let i1;
    	let t10;
    	let t11;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t13;
    	let th1;
    	let t15;
    	let th2;
    	let t17;
    	let th3;
    	let t19;
    	let th4;
    	let t21;
    	let tbody;
    	let current;

    	const link0 = new Link({
    			props: {
    				to: "dashboard",
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const link1 = new Link({
    			props: {
    				to: "tambahstaf",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let each_value = /*staff_data*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div15 = element("div");
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
    			li1.textContent = "Staf";
    			t3 = space();
    			section1 = element("section");
    			div14 = element("div");
    			div13 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			div10 = element("div");
    			div5 = element("div");
    			i0 = element("i");
    			t4 = space();
    			div4 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Daftar Staf";
    			t6 = space();
    			p = element("p");
    			p.textContent = "Kelola staf disini";
    			t8 = space();
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			input = element("input");
    			t9 = space();
    			div6 = element("div");
    			span = element("span");
    			i1 = element("i");
    			t10 = space();
    			create_component(link1.$$.fragment);
    			t11 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "#";
    			t13 = space();
    			th1 = element("th");
    			th1.textContent = "Nama Lengkap";
    			t15 = space();
    			th2 = element("th");
    			th2.textContent = "Posisi";
    			t17 = space();
    			th3 = element("th");
    			th3.textContent = "Status";
    			t19 = space();
    			th4 = element("th");
    			th4.textContent = "Aksi";
    			t21 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h1, file$3, 59, 12, 1286);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$3, 58, 10, 1251);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$3, 63, 14, 1411);
    			attr_dev(li1, "class", "breadcrumb-item active");
    			add_location(li1, file$3, 64, 14, 1498);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$3, 62, 12, 1358);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$3, 61, 10, 1323);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$3, 57, 8, 1218);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$3, 56, 6, 1180);
    			attr_dev(section0, "class", "content-header");
    			add_location(section0, file$3, 55, 4, 1141);
    			attr_dev(i0, "class", "fa fa-users mr-3 mt-3 svelte-1qcq442");
    			add_location(i0, file$3, 79, 18, 1958);
    			attr_dev(h5, "class", "mb-0");
    			add_location(h5, file$3, 81, 20, 2040);
    			attr_dev(p, "class", "mt-1");
    			add_location(p, file$3, 82, 20, 2094);
    			add_location(div4, file$3, 80, 18, 2014);
    			attr_dev(div5, "class", "page-heading svelte-1qcq442");
    			add_location(div5, file$3, 78, 16, 1913);
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "placeholder", "Cari disini..");
    			attr_dev(input, "type", "text");
    			add_location(input, file$3, 88, 22, 2341);
    			set_style(i1, "cursor", "pointer");
    			attr_dev(i1, "class", "fa fa-search");
    			add_location(i1, file$3, 90, 55, 2520);
    			attr_dev(span, "class", "input-group-text");
    			add_location(span, file$3, 90, 24, 2489);
    			attr_dev(div6, "class", "input-group-append");
    			add_location(div6, file$3, 89, 22, 2432);
    			attr_dev(div7, "class", "input-group");
    			add_location(div7, file$3, 87, 20, 2293);
    			attr_dev(div8, "class", "form-group mr-2");
    			add_location(div8, file$3, 86, 18, 2243);
    			attr_dev(div9, "class", "heading-tools svelte-1qcq442");
    			add_location(div9, file$3, 85, 16, 2197);
    			attr_dev(div10, "class", "card-header");
    			add_location(div10, file$3, 77, 14, 1871);
    			attr_dev(th0, "class", "text-center");
    			add_location(th0, file$3, 105, 24, 3085);
    			add_location(th1, file$3, 106, 24, 3140);
    			add_location(th2, file$3, 107, 24, 3186);
    			add_location(th3, file$3, 108, 24, 3226);
    			attr_dev(th4, "class", "text-right");
    			add_location(th4, file$3, 109, 24, 3266);
    			add_location(tr, file$3, 104, 20, 3056);
    			add_location(thead, file$3, 103, 16, 3028);
    			add_location(tbody, file$3, 112, 16, 3366);
    			attr_dev(table, "class", "table");
    			add_location(table, file$3, 102, 14, 2990);
    			attr_dev(div11, "class", "card card-primary card-outline");
    			add_location(div11, file$3, 76, 12, 1812);
    			attr_dev(div12, "class", "col-md-12");
    			add_location(div12, file$3, 75, 10, 1776);
    			attr_dev(div13, "class", "row");
    			add_location(div13, file$3, 74, 8, 1748);
    			attr_dev(div14, "class", "container-fluid");
    			add_location(div14, file$3, 73, 6, 1710);
    			attr_dev(section1, "class", "content");
    			add_location(section1, file$3, 72, 4, 1678);
    			attr_dev(div15, "class", "container");
    			add_location(div15, file$3, 53, 2, 1071);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div15, anchor);
    			append_dev(div15, section0);
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
    			append_dev(div15, t3);
    			append_dev(div15, section1);
    			append_dev(section1, div14);
    			append_dev(div14, div13);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div10, div5);
    			append_dev(div5, i0);
    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			append_dev(div4, h5);
    			append_dev(div4, t6);
    			append_dev(div4, p);
    			append_dev(div10, t8);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, input);
    			append_dev(div7, t9);
    			append_dev(div7, div6);
    			append_dev(div6, span);
    			append_dev(span, i1);
    			append_dev(div9, t10);
    			mount_component(link1, div9, null);
    			append_dev(div11, t11);
    			append_dev(div11, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t13);
    			append_dev(tr, th1);
    			append_dev(tr, t15);
    			append_dev(tr, th2);
    			append_dev(tr, t17);
    			append_dev(tr, th3);
    			append_dev(tr, t19);
    			append_dev(tr, th4);
    			append_dev(table, t21);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link0_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				link0_changes.$$scope = { dirty, ctx };
    			}

    			link0.$set(link0_changes);
    			const link1_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				link1_changes.$$scope = { dirty, ctx };
    			}

    			link1.$set(link1_changes);

    			if (dirty & /*staff_data*/ 1) {
    				each_value = /*staff_data*/ ctx[0];
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
    			transition_in(link0.$$.fragment, local);
    			transition_in(link1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link0.$$.fragment, local);
    			transition_out(link1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div15);
    			destroy_component(link0);
    			destroy_component(link1);
    			destroy_each(each_blocks, detaching);
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

    function instance$5($$self, $$props, $$invalidate) {
    	let staff_data = [
    		{
    			id: "1",
    			nama_lengkap: "Andrew Mike",
    			posisi: "Administrator",
    			status: "aktif"
    		},
    		{
    			id: "2",
    			nama_lengkap: "John Doe",
    			posisi: "Kasir",
    			status: "aktif"
    		},
    		{
    			id: "3",
    			nama_lengkap: "Aaron Doe",
    			posisi: "Beautician",
    			status: "aktif"
    		},
    		{
    			id: "4",
    			nama_lengkap: "Bob Larsson",
    			posisi: "Stylist",
    			status: "aktif"
    		},
    		{
    			id: "5",
    			nama_lengkap: "Mimin",
    			posisi: "Hair Washer",
    			status: "aktif"
    		}
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Staf> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Staf", $$slots, []);
    	$$self.$capture_state = () => ({ Router, Link, Route, staff_data });

    	$$self.$inject_state = $$props => {
    		if ("staff_data" in $$props) $$invalidate(0, staff_data = $$props.staff_data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [staff_data];
    }

    class Staf extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Staf",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/Pages/TambahStaf.svelte generated by Svelte v3.19.2 */
    const file$4 = "src/Pages/TambahStaf.svelte";

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
    function create_default_slot_1$2(ctx) {
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
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(20:40) <Link to = \\\"staf\\\">",
    		ctx
    	});

    	return block;
    }

    // (83:18) <Link to="staf">
    function create_default_slot$2(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "BATAL";
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-danger");
    			add_location(button, file$4, 82, 34, 3571);
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
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(83:18) <Link to=\\\"staf\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
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
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const link2 = new Link({
    			props: {
    				to: "staf",
    				$$slots: { default: [create_default_slot$2] },
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
    			add_location(h1, file$4, 14, 10, 406);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$4, 13, 8, 373);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$4, 18, 12, 523);
    			attr_dev(li1, "class", "breadcrumb-item");
    			add_location(li1, file$4, 19, 12, 608);
    			attr_dev(li2, "class", "breadcrumb-item active");
    			add_location(li2, file$4, 20, 12, 683);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$4, 17, 10, 472);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$4, 16, 8, 439);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$4, 12, 6, 342);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$4, 11, 4, 306);
    			attr_dev(section0, "class", "content-header");
    			add_location(section0, file$4, 10, 2, 269);
    			attr_dev(i, "class", "fas fa-user-plus mr-2");
    			add_location(i, file$4, 36, 36, 1145);
    			attr_dev(h5, "class", "mt-1 mb-0");
    			add_location(h5, file$4, 36, 14, 1123);
    			attr_dev(div4, "class", "card-header");
    			add_location(div4, file$4, 35, 12, 1083);
    			attr_dev(label0, "for", "namaLengkap important-form");
    			add_location(label0, file$4, 43, 20, 1425);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "namaLengkap");
    			attr_dev(input0, "placeholder", "Masukkan Nama Lengkap");
    			add_location(input0, file$4, 44, 20, 1506);
    			attr_dev(div5, "class", "form-group");
    			add_location(div5, file$4, 42, 18, 1380);
    			attr_dev(label1, "for", "username");
    			add_location(label1, file$4, 47, 20, 1688);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "id", "username");
    			attr_dev(input1, "placeholder", "Masukkan Username");
    			add_location(input1, file$4, 48, 20, 1747);
    			attr_dev(div6, "class", "form-group");
    			add_location(div6, file$4, 46, 18, 1643);
    			attr_dev(label2, "for", "password");
    			add_location(label2, file$4, 51, 20, 1922);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "id", "password");
    			attr_dev(input2, "placeholder", "Masukkan Password");
    			add_location(input2, file$4, 52, 20, 1981);
    			attr_dev(div7, "class", "form-group");
    			add_location(div7, file$4, 50, 18, 1877);
    			add_location(label3, file$4, 55, 20, 2156);
    			option0.__value = "-PILIH-";
    			option0.value = option0.__value;
    			add_location(option0, file$4, 57, 22, 2250);
    			option1.__value = "Administrator";
    			option1.value = option1.__value;
    			add_location(option1, file$4, 58, 22, 2297);
    			option2.__value = "Kasir";
    			option2.value = option2.__value;
    			add_location(option2, file$4, 59, 22, 2350);
    			option3.__value = "Bautician";
    			option3.value = option3.__value;
    			add_location(option3, file$4, 60, 22, 2395);
    			option4.__value = "Stylist";
    			option4.value = option4.__value;
    			add_location(option4, file$4, 61, 22, 2444);
    			option5.__value = "Hair washer";
    			option5.value = option5.__value;
    			add_location(option5, file$4, 62, 22, 2491);
    			attr_dev(select, "class", "form-control");
    			add_location(select, file$4, 56, 20, 2198);
    			attr_dev(div8, "class", "form-group");
    			add_location(div8, file$4, 54, 18, 2111);
    			attr_dev(label4, "for", "status");
    			add_location(label4, file$4, 66, 20, 2639);
    			attr_dev(input3, "name", "radioStatus");
    			attr_dev(input3, "class", "custom-control-input");
    			attr_dev(input3, "id", "radioAktif");
    			input3.checked = "radioAktif";
    			attr_dev(input3, "type", "radio");
    			add_location(input3, file$4, 68, 22, 2763);
    			attr_dev(label5, "class", "custom-control-label");
    			attr_dev(label5, "for", "radioAktif");
    			add_location(label5, file$4, 69, 22, 2891);
    			attr_dev(div9, "class", "custom-control custom-radio mb-3");
    			add_location(div9, file$4, 67, 20, 2694);
    			attr_dev(input4, "name", "radioStatus");
    			attr_dev(input4, "class", "custom-control-input");
    			attr_dev(input4, "id", "radioTidakAktif");
    			input4.checked = "";
    			attr_dev(input4, "type", "radio");
    			add_location(input4, file$4, 72, 22, 3074);
    			attr_dev(label6, "class", "custom-control-label");
    			attr_dev(label6, "for", "radioTidakAktif");
    			add_location(label6, file$4, 73, 22, 3197);
    			attr_dev(div10, "class", "custom-control custom-radio mb-3");
    			add_location(div10, file$4, 71, 20, 3005);
    			attr_dev(div11, "class", "form-group");
    			add_location(div11, file$4, 65, 19, 2594);
    			attr_dev(div12, "class", "card-body");
    			add_location(div12, file$4, 41, 16, 1338);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$4, 81, 18, 3467);
    			attr_dev(div13, "class", "card-footer");
    			add_location(div13, file$4, 80, 16, 3423);
    			attr_dev(form, "role", "form");
    			add_location(form, file$4, 40, 14, 1303);
    			attr_dev(div14, "class", "card card-primary card-outline");
    			add_location(div14, file$4, 34, 10, 1026);
    			attr_dev(div15, "class", "col-md-12");
    			add_location(div15, file$4, 32, 8, 951);
    			attr_dev(div16, "class", "row");
    			add_location(div16, file$4, 30, 6, 896);
    			attr_dev(div17, "class", "container-fluid");
    			add_location(div17, file$4, 29, 4, 860);
    			attr_dev(section1, "class", "content");
    			add_location(section1, file$4, 28, 2, 830);
    			attr_dev(div18, "class", "container");
    			add_location(div18, file$4, 8, 0, 203);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TambahStaf",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/Pages/Produkkecantikan.svelte generated by Svelte v3.19.2 */
    const file$5 = "src/Pages/Produkkecantikan.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (48:42) <Link to = "dashboard">
    function create_default_slot_1$3(ctx) {
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
    		id: create_default_slot_1$3.name,
    		type: "slot",
    		source: "(48:42) <Link to = \\\"dashboard\\\">",
    		ctx
    	});

    	return block;
    }

    // (79:18) <Link to="tambahprodukkecantikan">
    function create_default_slot$3(ctx) {
    	let button;
    	let i;
    	let t;

    	const block = {
    		c: function create() {
    			button = element("button");
    			i = element("i");
    			t = text(" Tambah Produk Kecantikan");
    			attr_dev(i, "class", "fa fa-plus mr-2");
    			add_location(i, file$5, 80, 22, 2512);
    			attr_dev(button, "class", "btn btn-primary btn-round btn-md");
    			add_location(button, file$5, 79, 20, 2440);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, i);
    			append_dev(button, t);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(79:18) <Link to=\\\"tambahprodukkecantikan\\\">",
    		ctx
    	});

    	return block;
    }

    // (99:20) {#each product_data as product}
    function create_each_block$2(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*product*/ ctx[1].id + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*product*/ ctx[1].barcode + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*product*/ ctx[1].nama_produk + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*product*/ ctx[1].harga + "";
    	let t6;
    	let t7;
    	let td4;
    	let span;
    	let t8_value = /*product*/ ctx[1].stok + "";
    	let t8;
    	let t9;
    	let td5;
    	let button0;
    	let i0;
    	let t10;
    	let button1;
    	let i1;
    	let t11;

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
    			span = element("span");
    			t8 = text(t8_value);
    			t9 = space();
    			td5 = element("td");
    			button0 = element("button");
    			i0 = element("i");
    			t10 = space();
    			button1 = element("button");
    			i1 = element("i");
    			t11 = space();
    			attr_dev(td0, "class", "text-center");
    			add_location(td0, file$5, 100, 26, 3246);
    			add_location(td1, file$5, 101, 26, 3314);
    			add_location(td2, file$5, 102, 26, 3367);
    			add_location(td3, file$5, 103, 26, 3424);
    			attr_dev(span, "class", "badge badge-success");
    			add_location(span, file$5, 104, 30, 3479);
    			add_location(td4, file$5, 104, 26, 3475);
    			attr_dev(i0, "class", "fa fa-pencil-ruler pt-1");
    			add_location(i0, file$5, 107, 30, 3766);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "rel", "tooltip");
    			attr_dev(button0, "class", "btn btn-info btn-icon btn-sm ");
    			attr_dev(button0, "data-original-title", "");
    			attr_dev(button0, "title", "");
    			add_location(button0, file$5, 106, 28, 3629);
    			attr_dev(i1, "class", "fa fa-trash pt-1");
    			add_location(i1, file$5, 109, 136, 3980);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "rel", "tooltip");
    			attr_dev(button1, "class", "btn btn-danger btn-icon btn-sm ");
    			attr_dev(button1, "data-original-title", "");
    			attr_dev(button1, "title", "");
    			add_location(button1, file$5, 109, 28, 3872);
    			attr_dev(td5, "class", "td-actions text-right");
    			add_location(td5, file$5, 105, 26, 3566);
    			add_location(tr, file$5, 99, 22, 3215);
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
    			append_dev(td4, span);
    			append_dev(span, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td5);
    			append_dev(td5, button0);
    			append_dev(button0, i0);
    			append_dev(td5, t10);
    			append_dev(td5, button1);
    			append_dev(button1, i1);
    			append_dev(tr, t11);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(99:20) {#each product_data as product}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div15;
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
    	let t3;
    	let section1;
    	let div14;
    	let div13;
    	let div12;
    	let div11;
    	let div10;
    	let div5;
    	let i0;
    	let t4;
    	let div4;
    	let h5;
    	let t6;
    	let p;
    	let t8;
    	let div9;
    	let div8;
    	let div7;
    	let input;
    	let t9;
    	let div6;
    	let span;
    	let i1;
    	let t10;
    	let t11;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t13;
    	let th1;
    	let t15;
    	let th2;
    	let t17;
    	let th3;
    	let t19;
    	let th4;
    	let t21;
    	let th5;
    	let t23;
    	let tbody;
    	let current;

    	const link0 = new Link({
    			props: {
    				to: "dashboard",
    				$$slots: { default: [create_default_slot_1$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const link1 = new Link({
    			props: {
    				to: "tambahprodukkecantikan",
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let each_value = /*product_data*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div15 = element("div");
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
    			li1.textContent = "Produk Kecantikan";
    			t3 = space();
    			section1 = element("section");
    			div14 = element("div");
    			div13 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			div10 = element("div");
    			div5 = element("div");
    			i0 = element("i");
    			t4 = space();
    			div4 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Daftar Produk Kecantikan";
    			t6 = space();
    			p = element("p");
    			p.textContent = "Kelola produk kecantikan disini";
    			t8 = space();
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			input = element("input");
    			t9 = space();
    			div6 = element("div");
    			span = element("span");
    			i1 = element("i");
    			t10 = space();
    			create_component(link1.$$.fragment);
    			t11 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "#";
    			t13 = space();
    			th1 = element("th");
    			th1.textContent = "Barcode";
    			t15 = space();
    			th2 = element("th");
    			th2.textContent = "Nama Produk";
    			t17 = space();
    			th3 = element("th");
    			th3.textContent = "Harga";
    			t19 = space();
    			th4 = element("th");
    			th4.textContent = "Stok";
    			t21 = space();
    			th5 = element("th");
    			th5.textContent = "Aksi";
    			t23 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h1, file$5, 43, 12, 952);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$5, 42, 10, 917);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$5, 47, 14, 1077);
    			attr_dev(li1, "class", "breadcrumb-item active");
    			add_location(li1, file$5, 48, 14, 1164);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$5, 46, 12, 1024);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$5, 45, 10, 989);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$5, 41, 8, 884);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$5, 40, 6, 846);
    			attr_dev(section0, "class", "content-header");
    			add_location(section0, file$5, 39, 4, 807);
    			attr_dev(i0, "class", "fa fa-cubes mr-3 mt-3 svelte-13ihtny");
    			add_location(i0, file$5, 63, 18, 1637);
    			attr_dev(h5, "class", "mb-0");
    			add_location(h5, file$5, 65, 20, 1719);
    			attr_dev(p, "class", "mt-1");
    			add_location(p, file$5, 66, 20, 1786);
    			add_location(div4, file$5, 64, 18, 1693);
    			attr_dev(div5, "class", "page-heading svelte-13ihtny");
    			add_location(div5, file$5, 62, 16, 1592);
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "placeholder", "Cari disini..");
    			attr_dev(input, "type", "text");
    			add_location(input, file$5, 72, 22, 2046);
    			set_style(i1, "cursor", "pointer");
    			attr_dev(i1, "class", "fa fa-search");
    			add_location(i1, file$5, 74, 55, 2225);
    			attr_dev(span, "class", "input-group-text");
    			add_location(span, file$5, 74, 24, 2194);
    			attr_dev(div6, "class", "input-group-append");
    			add_location(div6, file$5, 73, 22, 2137);
    			attr_dev(div7, "class", "input-group");
    			add_location(div7, file$5, 71, 20, 1998);
    			attr_dev(div8, "class", "form-group mr-2");
    			add_location(div8, file$5, 70, 18, 1948);
    			attr_dev(div9, "class", "heading-tools svelte-13ihtny");
    			add_location(div9, file$5, 69, 16, 1902);
    			attr_dev(div10, "class", "card-header");
    			add_location(div10, file$5, 61, 14, 1550);
    			attr_dev(th0, "class", "text-center");
    			add_location(th0, file$5, 89, 24, 2815);
    			add_location(th1, file$5, 90, 24, 2870);
    			add_location(th2, file$5, 91, 24, 2911);
    			add_location(th3, file$5, 92, 24, 2956);
    			add_location(th4, file$5, 93, 24, 2995);
    			attr_dev(th5, "class", "text-right");
    			add_location(th5, file$5, 94, 24, 3033);
    			add_location(tr, file$5, 88, 20, 2786);
    			add_location(thead, file$5, 87, 16, 2758);
    			add_location(tbody, file$5, 97, 16, 3133);
    			attr_dev(table, "class", "table");
    			add_location(table, file$5, 86, 14, 2720);
    			attr_dev(div11, "class", "card card-primary card-outline");
    			add_location(div11, file$5, 60, 12, 1491);
    			attr_dev(div12, "class", "col-md-12");
    			add_location(div12, file$5, 59, 10, 1455);
    			attr_dev(div13, "class", "row");
    			add_location(div13, file$5, 58, 8, 1427);
    			attr_dev(div14, "class", "container-fluid");
    			add_location(div14, file$5, 57, 6, 1389);
    			attr_dev(section1, "class", "content");
    			add_location(section1, file$5, 56, 4, 1357);
    			attr_dev(div15, "class", "container");
    			add_location(div15, file$5, 37, 2, 737);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div15, anchor);
    			append_dev(div15, section0);
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
    			append_dev(div15, t3);
    			append_dev(div15, section1);
    			append_dev(section1, div14);
    			append_dev(div14, div13);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div10, div5);
    			append_dev(div5, i0);
    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			append_dev(div4, h5);
    			append_dev(div4, t6);
    			append_dev(div4, p);
    			append_dev(div10, t8);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, input);
    			append_dev(div7, t9);
    			append_dev(div7, div6);
    			append_dev(div6, span);
    			append_dev(span, i1);
    			append_dev(div9, t10);
    			mount_component(link1, div9, null);
    			append_dev(div11, t11);
    			append_dev(div11, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t13);
    			append_dev(tr, th1);
    			append_dev(tr, t15);
    			append_dev(tr, th2);
    			append_dev(tr, t17);
    			append_dev(tr, th3);
    			append_dev(tr, t19);
    			append_dev(tr, th4);
    			append_dev(tr, t21);
    			append_dev(tr, th5);
    			append_dev(table, t23);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link0_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				link0_changes.$$scope = { dirty, ctx };
    			}

    			link0.$set(link0_changes);
    			const link1_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				link1_changes.$$scope = { dirty, ctx };
    			}

    			link1.$set(link1_changes);

    			if (dirty & /*product_data*/ 1) {
    				each_value = /*product_data*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
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
    			transition_in(link0.$$.fragment, local);
    			transition_in(link1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link0.$$.fragment, local);
    			transition_out(link1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div15);
    			destroy_component(link0);
    			destroy_component(link1);
    			destroy_each(each_blocks, detaching);
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
    	let product_data = [
    		{
    			id: "1",
    			barcode: "1",
    			nama_produk: "Serum",
    			harga: "Rp. 300.000",
    			stok: "100"
    		},
    		{
    			id: "2",
    			barcode: "2",
    			nama_produk: "Toner",
    			harga: "Rp. 150.000",
    			stok: "100"
    		}
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Produkkecantikan> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Produkkecantikan", $$slots, []);
    	$$self.$capture_state = () => ({ Router, Link, Route, product_data });

    	$$self.$inject_state = $$props => {
    		if ("product_data" in $$props) $$invalidate(0, product_data = $$props.product_data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [product_data];
    }

    class Produkkecantikan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Produkkecantikan",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/Pages/TambahProdukkecantikan.svelte generated by Svelte v3.19.2 */
    const file$6 = "src/Pages/TambahProdukkecantikan.svelte";

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
    function create_default_slot_1$4(ctx) {
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
    		id: create_default_slot_1$4.name,
    		type: "slot",
    		source: "(20:40) <Link to = \\\"produkkecantikan\\\">",
    		ctx
    	});

    	return block;
    }

    // (60:18) <Link to="produkkecantikan">
    function create_default_slot$4(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "BATAL";
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-danger");
    			add_location(button, file$6, 59, 46, 2414);
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
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(60:18) <Link to=\\\"produkkecantikan\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
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
    				$$slots: { default: [create_default_slot_1$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const link2 = new Link({
    			props: {
    				to: "produkkecantikan",
    				$$slots: { default: [create_default_slot$4] },
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
    			add_location(h1, file$6, 14, 10, 418);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$6, 13, 8, 385);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$6, 18, 12, 535);
    			attr_dev(li1, "class", "breadcrumb-item");
    			add_location(li1, file$6, 19, 12, 620);
    			attr_dev(li2, "class", "breadcrumb-item active");
    			add_location(li2, file$6, 20, 12, 720);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$6, 17, 10, 484);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$6, 16, 8, 451);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$6, 12, 6, 354);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$6, 11, 4, 318);
    			attr_dev(section0, "class", "content-header");
    			add_location(section0, file$6, 10, 2, 281);
    			attr_dev(i, "class", "fas fa-plus-square mr-2");
    			add_location(i, file$6, 36, 36, 1195);
    			attr_dev(h5, "class", "mt-1 mb-0");
    			add_location(h5, file$6, 36, 14, 1173);
    			attr_dev(div4, "class", "card-header");
    			add_location(div4, file$6, 35, 12, 1133);
    			attr_dev(label0, "for", "barcode important-form");
    			add_location(label0, file$6, 43, 20, 1490);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "barcode");
    			attr_dev(input0, "placeholder", "Masukkan Barcode");
    			add_location(input0, file$6, 44, 20, 1562);
    			attr_dev(div5, "class", "form-group");
    			add_location(div5, file$6, 42, 18, 1445);
    			attr_dev(label1, "for", "product_name");
    			add_location(label1, file$6, 47, 20, 1735);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "id", "product_name");
    			attr_dev(input1, "placeholder", "Masukkan Nama Produk Kecantikan");
    			add_location(input1, file$6, 48, 20, 1812);
    			attr_dev(div6, "class", "form-group");
    			add_location(div6, file$6, 46, 18, 1690);
    			attr_dev(label2, "for", "harga");
    			add_location(label2, file$6, 51, 20, 2005);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "id", "harga");
    			attr_dev(input2, "placeholder", "Masukkan Harga");
    			add_location(input2, file$6, 52, 20, 2058);
    			attr_dev(div7, "class", "form-group");
    			add_location(div7, file$6, 50, 18, 1960);
    			attr_dev(div8, "class", "card-body");
    			add_location(div8, file$6, 41, 16, 1403);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$6, 58, 18, 2285);
    			attr_dev(div9, "class", "card-footer");
    			add_location(div9, file$6, 57, 16, 2241);
    			attr_dev(form, "role", "form");
    			add_location(form, file$6, 40, 14, 1368);
    			attr_dev(div10, "class", "card card-primary card-outline");
    			add_location(div10, file$6, 34, 10, 1076);
    			attr_dev(div11, "class", "col-md-12");
    			add_location(div11, file$6, 32, 8, 1001);
    			attr_dev(div12, "class", "row");
    			add_location(div12, file$6, 30, 6, 946);
    			attr_dev(div13, "class", "container-fluid");
    			add_location(div13, file$6, 29, 4, 910);
    			attr_dev(section1, "class", "content");
    			add_location(section1, file$6, 28, 2, 880);
    			attr_dev(div14, "class", "container");
    			add_location(div14, file$6, 8, 0, 215);
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TambahProdukkecantikan",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/Pages/Layanan.svelte generated by Svelte v3.19.2 */
    const file$7 = "src/Pages/Layanan.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (46:42) <Link to = "dashboard">
    function create_default_slot_1$5(ctx) {
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
    		id: create_default_slot_1$5.name,
    		type: "slot",
    		source: "(46:42) <Link to = \\\"dashboard\\\">",
    		ctx
    	});

    	return block;
    }

    // (77:18) <Link to="tambahlayanan">
    function create_default_slot$5(ctx) {
    	let button;
    	let i;
    	let t;

    	const block = {
    		c: function create() {
    			button = element("button");
    			i = element("i");
    			t = text(" Tambah Layanan");
    			attr_dev(i, "class", "fa fa-plus mr-2");
    			add_location(i, file$7, 78, 22, 2445);
    			attr_dev(button, "class", "btn btn-primary btn-round btn-md");
    			add_location(button, file$7, 77, 20, 2373);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, i);
    			append_dev(button, t);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(77:18) <Link to=\\\"tambahlayanan\\\">",
    		ctx
    	});

    	return block;
    }

    // (96:20) {#each service_data as service}
    function create_each_block$3(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*service*/ ctx[1].id + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*service*/ ctx[1].nama_layanan + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*service*/ ctx[1].harga + "";
    	let t4;
    	let t5;
    	let td3;
    	let span;
    	let t6_value = /*service*/ ctx[1].kategori + "";
    	let t6;
    	let t7;
    	let td4;
    	let button0;
    	let i0;
    	let t8;
    	let button1;
    	let i1;
    	let t9;

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
    			span = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			button0 = element("button");
    			i0 = element("i");
    			t8 = space();
    			button1 = element("button");
    			i1 = element("i");
    			t9 = space();
    			attr_dev(td0, "class", "text-center");
    			add_location(td0, file$7, 97, 26, 3133);
    			add_location(td1, file$7, 98, 26, 3201);
    			add_location(td2, file$7, 99, 26, 3259);
    			attr_dev(span, "class", "badge badge-success");
    			add_location(span, file$7, 100, 30, 3314);
    			add_location(td3, file$7, 100, 26, 3310);
    			attr_dev(i0, "class", "fa fa-pencil-ruler pt-1");
    			add_location(i0, file$7, 103, 30, 3605);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "rel", "tooltip");
    			attr_dev(button0, "class", "btn btn-info btn-icon btn-sm ");
    			attr_dev(button0, "data-original-title", "");
    			attr_dev(button0, "title", "");
    			add_location(button0, file$7, 102, 28, 3468);
    			attr_dev(i1, "class", "fa fa-trash pt-1");
    			add_location(i1, file$7, 105, 136, 3819);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "rel", "tooltip");
    			attr_dev(button1, "class", "btn btn-danger btn-icon btn-sm ");
    			attr_dev(button1, "data-original-title", "");
    			attr_dev(button1, "title", "");
    			add_location(button1, file$7, 105, 28, 3711);
    			attr_dev(td4, "class", "td-actions text-right");
    			add_location(td4, file$7, 101, 26, 3405);
    			add_location(tr, file$7, 96, 22, 3102);
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
    			append_dev(td3, span);
    			append_dev(span, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td4);
    			append_dev(td4, button0);
    			append_dev(button0, i0);
    			append_dev(td4, t8);
    			append_dev(td4, button1);
    			append_dev(button1, i1);
    			append_dev(tr, t9);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(96:20) {#each service_data as service}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div15;
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
    	let t3;
    	let section1;
    	let div14;
    	let div13;
    	let div12;
    	let div11;
    	let div10;
    	let div5;
    	let i0;
    	let t4;
    	let div4;
    	let h5;
    	let t6;
    	let p;
    	let t8;
    	let div9;
    	let div8;
    	let div7;
    	let input;
    	let t9;
    	let div6;
    	let span;
    	let i1;
    	let t10;
    	let t11;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t13;
    	let th1;
    	let t15;
    	let th2;
    	let t17;
    	let th3;
    	let t19;
    	let th4;
    	let t21;
    	let tbody;
    	let current;

    	const link0 = new Link({
    			props: {
    				to: "dashboard",
    				$$slots: { default: [create_default_slot_1$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const link1 = new Link({
    			props: {
    				to: "tambahlayanan",
    				$$slots: { default: [create_default_slot$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let each_value = /*service_data*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div15 = element("div");
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
    			li1.textContent = "Layanan";
    			t3 = space();
    			section1 = element("section");
    			div14 = element("div");
    			div13 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			div10 = element("div");
    			div5 = element("div");
    			i0 = element("i");
    			t4 = space();
    			div4 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Daftar Layanan";
    			t6 = space();
    			p = element("p");
    			p.textContent = "Kelola layanan disini";
    			t8 = space();
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			input = element("input");
    			t9 = space();
    			div6 = element("div");
    			span = element("span");
    			i1 = element("i");
    			t10 = space();
    			create_component(link1.$$.fragment);
    			t11 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "#";
    			t13 = space();
    			th1 = element("th");
    			th1.textContent = "Nama Layanan";
    			t15 = space();
    			th2 = element("th");
    			th2.textContent = "Harga";
    			t17 = space();
    			th3 = element("th");
    			th3.textContent = "Kategori";
    			t19 = space();
    			th4 = element("th");
    			th4.textContent = "Aksi";
    			t21 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h1, file$7, 41, 12, 920);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$7, 40, 10, 885);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$7, 45, 14, 1045);
    			attr_dev(li1, "class", "breadcrumb-item active");
    			add_location(li1, file$7, 46, 14, 1132);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$7, 44, 12, 992);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$7, 43, 10, 957);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$7, 39, 8, 852);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$7, 38, 6, 814);
    			attr_dev(section0, "class", "content-header");
    			add_location(section0, file$7, 37, 4, 775);
    			attr_dev(i0, "class", "fa fa-handshake mr-3 mt-3 svelte-12vmhq0");
    			add_location(i0, file$7, 61, 18, 1595);
    			attr_dev(h5, "class", "mb-0");
    			add_location(h5, file$7, 63, 20, 1681);
    			attr_dev(p, "class", "mt-1");
    			add_location(p, file$7, 64, 20, 1738);
    			add_location(div4, file$7, 62, 18, 1655);
    			attr_dev(div5, "class", "page-heading svelte-12vmhq0");
    			add_location(div5, file$7, 60, 16, 1550);
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "placeholder", "Cari disini..");
    			attr_dev(input, "type", "text");
    			add_location(input, file$7, 70, 22, 1988);
    			set_style(i1, "cursor", "pointer");
    			attr_dev(i1, "class", "fa fa-search");
    			add_location(i1, file$7, 72, 55, 2167);
    			attr_dev(span, "class", "input-group-text");
    			add_location(span, file$7, 72, 24, 2136);
    			attr_dev(div6, "class", "input-group-append");
    			add_location(div6, file$7, 71, 22, 2079);
    			attr_dev(div7, "class", "input-group");
    			add_location(div7, file$7, 69, 20, 1940);
    			attr_dev(div8, "class", "form-group mr-2");
    			add_location(div8, file$7, 68, 18, 1890);
    			attr_dev(div9, "class", "heading-tools svelte-12vmhq0");
    			add_location(div9, file$7, 67, 16, 1844);
    			attr_dev(div10, "class", "card-header");
    			add_location(div10, file$7, 59, 14, 1508);
    			attr_dev(th0, "class", "text-center");
    			add_location(th0, file$7, 87, 24, 2738);
    			add_location(th1, file$7, 88, 24, 2793);
    			add_location(th2, file$7, 89, 24, 2839);
    			add_location(th3, file$7, 90, 24, 2878);
    			attr_dev(th4, "class", "text-right");
    			add_location(th4, file$7, 91, 24, 2920);
    			add_location(tr, file$7, 86, 20, 2709);
    			add_location(thead, file$7, 85, 16, 2681);
    			add_location(tbody, file$7, 94, 16, 3020);
    			attr_dev(table, "class", "table");
    			add_location(table, file$7, 84, 14, 2643);
    			attr_dev(div11, "class", "card card-primary card-outline");
    			add_location(div11, file$7, 58, 12, 1449);
    			attr_dev(div12, "class", "col-md-12");
    			add_location(div12, file$7, 57, 10, 1413);
    			attr_dev(div13, "class", "row");
    			add_location(div13, file$7, 56, 8, 1385);
    			attr_dev(div14, "class", "container-fluid");
    			add_location(div14, file$7, 55, 6, 1347);
    			attr_dev(section1, "class", "content");
    			add_location(section1, file$7, 54, 4, 1315);
    			attr_dev(div15, "class", "container");
    			add_location(div15, file$7, 35, 2, 705);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div15, anchor);
    			append_dev(div15, section0);
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
    			append_dev(div15, t3);
    			append_dev(div15, section1);
    			append_dev(section1, div14);
    			append_dev(div14, div13);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div10, div5);
    			append_dev(div5, i0);
    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			append_dev(div4, h5);
    			append_dev(div4, t6);
    			append_dev(div4, p);
    			append_dev(div10, t8);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, input);
    			append_dev(div7, t9);
    			append_dev(div7, div6);
    			append_dev(div6, span);
    			append_dev(span, i1);
    			append_dev(div9, t10);
    			mount_component(link1, div9, null);
    			append_dev(div11, t11);
    			append_dev(div11, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t13);
    			append_dev(tr, th1);
    			append_dev(tr, t15);
    			append_dev(tr, th2);
    			append_dev(tr, t17);
    			append_dev(tr, th3);
    			append_dev(tr, t19);
    			append_dev(tr, th4);
    			append_dev(table, t21);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link0_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				link0_changes.$$scope = { dirty, ctx };
    			}

    			link0.$set(link0_changes);
    			const link1_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				link1_changes.$$scope = { dirty, ctx };
    			}

    			link1.$set(link1_changes);

    			if (dirty & /*service_data*/ 1) {
    				each_value = /*service_data*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
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
    			transition_in(link0.$$.fragment, local);
    			transition_in(link1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link0.$$.fragment, local);
    			transition_out(link1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div15);
    			destroy_component(link0);
    			destroy_component(link1);
    			destroy_each(each_blocks, detaching);
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
    	let service_data = [
    		{
    			id: "1",
    			nama_layanan: "Slimming",
    			harga: "Rp. 300.000",
    			kategori: "Clinic"
    		},
    		{
    			id: "2",
    			nama_layanan: "Gunting + Cuci",
    			harga: "Rp. 150.000",
    			kategori: "Salon"
    		}
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Layanan> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Layanan", $$slots, []);
    	$$self.$capture_state = () => ({ Router, Link, Route, service_data });

    	$$self.$inject_state = $$props => {
    		if ("service_data" in $$props) $$invalidate(0, service_data = $$props.service_data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [service_data];
    }

    class Layanan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Layanan",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/Pages/TambahLayanan.svelte generated by Svelte v3.19.2 */
    const file$8 = "src/Pages/TambahLayanan.svelte";

    // (19:40) <Link to = "dashboard">
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
    		source: "(19:40) <Link to = \\\"dashboard\\\">",
    		ctx
    	});

    	return block;
    }

    // (20:40) <Link to = "layanan">
    function create_default_slot_1$6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Layanan");
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
    		id: create_default_slot_1$6.name,
    		type: "slot",
    		source: "(20:40) <Link to = \\\"layanan\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:18) <Link to="layanan">
    function create_default_slot$6(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "BATAL";
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-danger");
    			add_location(button, file$8, 63, 37, 2417);
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
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(64:18) <Link to=\\\"layanan\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
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
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let t18;
    	let div9;
    	let button;
    	let t20;
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
    				to: "layanan",
    				$$slots: { default: [create_default_slot_1$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const link2 = new Link({
    			props: {
    				to: "layanan",
    				$$slots: { default: [create_default_slot$6] },
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
    			li2.textContent = "Tambah Layanan";
    			t4 = space();
    			section1 = element("section");
    			div13 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			div10 = element("div");
    			div4 = element("div");
    			h5 = element("h5");
    			i = element("i");
    			t5 = text("Tambah Layanan");
    			t6 = space();
    			form = element("form");
    			div8 = element("div");
    			div5 = element("div");
    			label0 = element("label");
    			label0.textContent = "Nama Layanan";
    			t8 = space();
    			input0 = element("input");
    			t9 = space();
    			div6 = element("div");
    			label1 = element("label");
    			label1.textContent = "Harga";
    			t11 = space();
    			input1 = element("input");
    			t12 = space();
    			div7 = element("div");
    			label2 = element("label");
    			label2.textContent = "Kategori";
    			t14 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "-PILIH-";
    			option1 = element("option");
    			option1.textContent = "Clinic";
    			option2 = element("option");
    			option2.textContent = "Salon";
    			t18 = space();
    			div9 = element("div");
    			button = element("button");
    			button.textContent = "TAMBAHKAN LAYANAN";
    			t20 = space();
    			create_component(link2.$$.fragment);
    			add_location(h1, file$8, 14, 10, 409);
    			attr_dev(div0, "class", "col-sm-6");
    			add_location(div0, file$8, 13, 8, 376);
    			attr_dev(li0, "class", "breadcrumb-item");
    			add_location(li0, file$8, 18, 12, 526);
    			attr_dev(li1, "class", "breadcrumb-item");
    			add_location(li1, file$8, 19, 12, 611);
    			attr_dev(li2, "class", "breadcrumb-item active");
    			add_location(li2, file$8, 20, 12, 692);
    			attr_dev(ol, "class", "breadcrumb float-sm-right");
    			add_location(ol, file$8, 17, 10, 475);
    			attr_dev(div1, "class", "col-sm-6");
    			add_location(div1, file$8, 16, 8, 442);
    			attr_dev(div2, "class", "row mb-2");
    			add_location(div2, file$8, 12, 6, 345);
    			attr_dev(div3, "class", "container-fluid");
    			add_location(div3, file$8, 11, 4, 309);
    			attr_dev(section0, "class", "content-header");
    			add_location(section0, file$8, 10, 2, 272);
    			attr_dev(i, "class", "fas fa-plus-square mr-2");
    			add_location(i, file$8, 36, 36, 1157);
    			attr_dev(h5, "class", "mt-1 mb-0");
    			add_location(h5, file$8, 36, 14, 1135);
    			attr_dev(div4, "class", "card-header");
    			add_location(div4, file$8, 35, 12, 1095);
    			attr_dev(label0, "for", "service important-form");
    			add_location(label0, file$8, 43, 20, 1442);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "service");
    			attr_dev(input0, "placeholder", "Masukkan Nama Layanan");
    			add_location(input0, file$8, 44, 20, 1519);
    			attr_dev(div5, "class", "form-group");
    			add_location(div5, file$8, 42, 18, 1397);
    			attr_dev(label1, "for", "harga");
    			add_location(label1, file$8, 47, 20, 1697);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "id", "harga");
    			attr_dev(input1, "placeholder", "Masukkan Harga");
    			add_location(input1, file$8, 48, 20, 1750);
    			attr_dev(div6, "class", "form-group");
    			add_location(div6, file$8, 46, 18, 1652);
    			add_location(label2, file$8, 51, 20, 1919);
    			option0.__value = "-PILIH-";
    			option0.value = option0.__value;
    			add_location(option0, file$8, 53, 22, 2015);
    			option1.__value = "Clinic";
    			option1.value = option1.__value;
    			add_location(option1, file$8, 54, 22, 2062);
    			option2.__value = "Salon";
    			option2.value = option2.__value;
    			add_location(option2, file$8, 55, 22, 2108);
    			attr_dev(select, "class", "form-control");
    			add_location(select, file$8, 52, 20, 1963);
    			attr_dev(div7, "class", "form-group");
    			add_location(div7, file$8, 50, 18, 1874);
    			attr_dev(div8, "class", "card-body");
    			add_location(div8, file$8, 41, 16, 1355);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$8, 62, 18, 2307);
    			attr_dev(div9, "class", "card-footer");
    			add_location(div9, file$8, 61, 16, 2263);
    			attr_dev(form, "role", "form");
    			add_location(form, file$8, 40, 14, 1320);
    			attr_dev(div10, "class", "card card-primary card-outline");
    			add_location(div10, file$8, 34, 10, 1038);
    			attr_dev(div11, "class", "col-md-12");
    			add_location(div11, file$8, 32, 8, 963);
    			attr_dev(div12, "class", "row");
    			add_location(div12, file$8, 30, 6, 908);
    			attr_dev(div13, "class", "container-fluid");
    			add_location(div13, file$8, 29, 4, 872);
    			attr_dev(section1, "class", "content");
    			add_location(section1, file$8, 28, 2, 842);
    			attr_dev(div14, "class", "container");
    			add_location(div14, file$8, 8, 0, 206);
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
    			append_dev(div7, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(form, t18);
    			append_dev(form, div9);
    			append_dev(div9, button);
    			append_dev(div9, t20);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TambahLayanan> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TambahLayanan", $$slots, []);
    	$$self.$capture_state = () => ({ Router, Link, Route });
    	return [];
    }

    class TambahLayanan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TambahLayanan",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/Pages/Dashboard.svelte generated by Svelte v3.19.2 */

    function create_fragment$b(ctx) {
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
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props) {
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
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dashboard",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.19.2 */
    const file$9 = "src/App.svelte";

    // (35:0) <Router>
    function create_default_slot$7(ctx) {
    	let t0;
    	let div0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let footer;
    	let div1;
    	let b;
    	let t9;
    	let t10;
    	let strong;
    	let t11;
    	let a;
    	let t13;
    	let t14;
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
    			footer = element("footer");
    			div1 = element("div");
    			b = element("b");
    			b.textContent = "Version";
    			t9 = text(" 1.0");
    			t10 = space();
    			strong = element("strong");
    			t11 = text("Copyright © 2020 ");
    			a = element("a");
    			a.textContent = "Lumera System";
    			t13 = text(".");
    			t14 = text(" All rights reserved.");
    			attr_dev(div0, "class", "content-wrapper svelte-kqx5hh");
    			set_style(div0, "margin-left", /*containerMarginVisibletoSidebar*/ ctx[0] + "px");
    			add_location(div0, file$9, 37, 3, 986);
    			add_location(b, file$9, 50, 8, 1694);
    			attr_dev(div1, "class", "float-right d-none d-sm-block");
    			add_location(div1, file$9, 49, 5, 1642);
    			attr_dev(a, "href", "#");
    			add_location(a, file$9, 52, 35, 1760);
    			add_location(strong, file$9, 52, 5, 1730);
    			attr_dev(footer, "class", "main-footer svelte-kqx5hh");
    			set_style(footer, "margin-left", /*containerMarginVisibletoSidebar*/ ctx[0] + "px");
    			add_location(footer, file$9, 48, 3, 1550);
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
    			insert_dev(target, t7, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div1);
    			append_dev(div1, b);
    			append_dev(div1, t9);
    			append_dev(footer, t10);
    			append_dev(footer, strong);
    			append_dev(strong, t11);
    			append_dev(strong, a);
    			append_dev(strong, t13);
    			append_dev(footer, t14);
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
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(35:0) <Router>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let current;

    	const router = new Router({
    			props: {
    				$$slots: { default: [create_default_slot$7] },
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
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$c.name
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
