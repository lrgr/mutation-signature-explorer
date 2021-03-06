// initial state
const state = {
    windowWidth: 0,
    windowHeight: 0,
    isImporting: false,
    fromImport: false,
    isLoading: false,
    continuousClinicalVariables: [],
    isProtected: true,
    isSession: false,
    isEmptySession: false,
    sessionId: undefined,
}

// getters
const getters = {
    windowWidth: state => state.windowWidth,
    windowHeight: state => state.windowHeight,
    isImporting: state => state.isImporting,
    fromImport: state => state.fromImport,
    isLoading: state => state.isLoading,
    continuousClinicalVariables: state => state.continuousClinicalVariables,
    isProtected: state => state.isProtected,
    isSession: state => state.isSession,
    isEmptySession: state => state.isEmptySession,
    sessionId: state => state.sessionId,
}

// actions
const actions = {

}

// mutations
const mutations = {
    setWindowWidth (state, windowWidth) {
        state.windowWidth = windowWidth;
    },
    setWindowHeight (state, windowHeight) {
        state.windowHeight = windowHeight;
    },
    setIsImporting (state, isImporting) {
        state.isImporting = isImporting;
    },
    setFromImport (state, fromImport) {
        state.fromImport = fromImport;
    },
    setIsLoading (state, isLoading) {
        state.isLoading = isLoading;
    },
    setContinuousClinicalVariables (state, clinicalVars) {
        state.continuousClinicalVariables = clinicalVars;
    },
    setIsProtected (state, isProtected) {
        state.isProtected = isProtected;
    },
    setSession(state, { isSession, isEmptySession, sessionId }) {
        state.isSession = isSession;
        state.isEmptySession = isEmptySession;
        state.sessionId = sessionId;
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}