using System;
using System.Collections.Generic;
using Newtonsoft.Json;

[Serializable]
public class AppStateWrapper
{
    [JsonProperty("appState")]
    public AppState AppState { get; set; } = new AppState();
}

[Serializable]
public class AppState
{
    [JsonProperty("worlds")]
    public Dictionary<string, WorldData> Worlds { get; set; } = new Dictionary<string, WorldData>();
}

[Serializable]
public class WorldData
{
    [JsonProperty("title")]
    public string Title { get; set; }

    [JsonProperty("order")]
    public int Order { get; set; }

    [JsonProperty("buttonImageUrl")]
    public string ButtonImageUrl { get; set; }

    [JsonProperty("backgroundImageUrl")]
    public string BackgroundImageUrl { get; set; }

    [JsonProperty("levels")]
    public Dictionary<string, LevelData> Levels { get; set; } = new Dictionary<string, LevelData>();
}

[Serializable]
public class LevelData
{
    [JsonProperty("title")]
    public string Title { get; set; }

    [JsonProperty("order")]
    public int Order { get; set; }

    [JsonProperty("lessons")]
    public Dictionary<string, LessonData> Lessons { get; set; } = new Dictionary<string, LessonData>();
}

[Serializable]
public class LessonData
{
    [JsonProperty("title")]
    public string Title { get; set; }

    [JsonProperty("order")]
    public int Order { get; set; }

    [JsonProperty("data")]
    public LessonContent Data { get; set; } = new LessonContent();
}

[Serializable]
public class LessonContent
{
    [JsonProperty("learningItems")]
    public LearningItemsData LearningItems { get; set; } = new LearningItemsData();

    [JsonProperty("quizzes")]
    public Dictionary<string, QuizItem> Quizzes { get; set; } = new Dictionary<string, QuizItem>();
}

[Serializable]
public class LearningItemsData
{
    [JsonProperty("name")]
    public string Name { get; set; }

    [JsonProperty("description")]
    public string Description { get; set; }

    [JsonProperty("gridSize")]
    public LearningGridSize GridSize { get; set; } = new LearningGridSize();

    [JsonProperty("items")]
    public Dictionary<string, LearningItem> Items { get; set; } = new Dictionary<string, LearningItem>();
}

[Serializable]
public class LearningGridSize
{
    [JsonProperty("rows")]
    public int Rows { get; set; } = 1;

    [JsonProperty("columns")]
    public int Columns { get; set; } = 1;
}

[Serializable]
public class LearningItem
{
    [JsonProperty("cells")]
    public Dictionary<string, LearningCell> Cells { get; set; } = new Dictionary<string, LearningCell>();
}

[Serializable]
public class LearningCell
{
    [JsonProperty("row")]
    public int Row { get; set; }

    [JsonProperty("column")]
    public int Column { get; set; }

    [JsonProperty("language")]
    public string Language { get; set; }

    [JsonProperty("text")]
    public string Text { get; set; }

    [JsonProperty("audioUrl")]
    public string AudioUrl { get; set; }
}

[Serializable]
public class QuizItem
{
    [JsonProperty("type")]
    public string Type { get; set; }

    [JsonProperty("order")]
    public int Order { get; set; }

    [JsonProperty("questionText")]
    public string QuestionText { get; set; }

    [JsonProperty("questionAudioUrl")]
    public string QuestionAudioUrl { get; set; }

    [JsonProperty("correctOptionId")]
    public string CorrectOptionId { get; set; }

    [JsonProperty("correctAnswerText")]
    public string CorrectAnswerText { get; set; }

    [JsonProperty("englishPromptText")]
    public string EnglishPromptText { get; set; }

    [JsonProperty("arabicPromptText")]
    public string ArabicPromptText { get; set; }

    [JsonProperty("options")]
    public Dictionary<string, QuizOption> Options { get; set; } = new Dictionary<string, QuizOption>();
}

[Serializable]
public class QuizOption
{
    [JsonProperty("text")]
    public string Text { get; set; }
}

