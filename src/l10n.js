var Localize = require('localize');
/**
 * Helper to get a new localize object
 * @param string file
 * @return Localize
 */
module.exports = function (l10n_file)
{
    if (typeof l10n_file == "string"){
    	return new Localize(require('js-yaml').load(require('fs').readFileSync(l10n_file).toString('utf8')), undefined, 'zz');
    }
    else {
        console.log("yep")
        return new Localize(l10n_file, undefined, 'zz');
    }
};
