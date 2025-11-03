const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');

/**
 * @param {string} templateName - The name of the template to use.
 * @param {object} data - The data to pass to the template.
 * @param {string} language - The language to use for the template.
 * @returns {Promise<{subject: string, html: string}>}
 */
const generateEmailTemplate = async (templateName, data, language = 'en') => {
  try {
    // Construct paths to the template and content files
    const templatePath = path.join(__dirname, '..', '..', 'emails', 'templates', `${templateName}.hbs`);
    const contentPath = path.join(__dirname, '..', '..', 'emails', 'content', `${templateName}.json`);

    // Read the template and content files
    const templateSource = await fs.readFile(templatePath, 'utf8');
    const contentJson = await fs.readFile(contentPath, 'utf8');
    const content = JSON.parse(contentJson);

    // Function to compile content for a given language
    const compileContent = (langContent) => {
      const compiled = {};
      for (const key in langContent) {
        if (typeof langContent[key] === 'string') {
          const contentTemplate = handlebars.compile(langContent[key]);
          compiled[key] = contentTemplate(data);
        } else {
          compiled[key] = langContent[key];
        }
      }
      return compiled;
    };

    // Compile both English and French content
    const enContent = compileContent(content['en']);
    const frContent = compileContent(content['fr']);

    // Compile the main template
    const template = handlebars.compile(templateSource);

    // Combine the compiled content with the dynamic data
    const templateData = { ...data, en: enContent, fr: frContent };

    // Generate the HTML
    const html = template(templateData);

    // Determine subject based on language
    const subject = (language === 'fr' && frContent.subject) ? frContent.subject : enContent.subject;

    return {
      subject,
      html,
    };
  } catch (error) {
    console.error(`Error generating email template ${templateName}:`, error);
    throw new Error('Could not generate email template.');
  }
};

module.exports = {
  generateEmailTemplate,
};
