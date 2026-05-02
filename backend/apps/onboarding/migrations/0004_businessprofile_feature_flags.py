from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("onboarding", "0003_area_name_optional"),
    ]

    operations = [
        migrations.AddField(
            model_name="businessprofile",
            name="feature_flags",
            field=models.JSONField(default=dict),
        ),
    ]
